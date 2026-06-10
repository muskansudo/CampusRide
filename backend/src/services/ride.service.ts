import { RideStatus, Role } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

const rideInclude = {
  passenger: {
    select: { id: true, name: true, phone: true, email: true },
  },
  driver: {
    select: { id: true, name: true, phone: true, email: true, driverProfile: true },
  },
  rating: true,
};

const MIN_SCHEDULE_MINUTES = 15;
const MAX_SCHEDULE_DAYS = 7;

function parseScheduledAt(value?: string): Date | null {
  if (!value) return null;
  const scheduled = new Date(value);
  if (Number.isNaN(scheduled.getTime())) {
    throw new Error("INVALID_SCHEDULE");
  }
  const minTime = Date.now() + MIN_SCHEDULE_MINUTES * 60 * 1000;
  const maxTime = Date.now() + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000;
  if (scheduled.getTime() < minTime || scheduled.getTime() > maxTime) {
    throw new Error("INVALID_SCHEDULE");
  }
  return scheduled;
}

export async function createRide(
  passengerId: string,
  data: {
    pickupLocation: string;
    destinationLocation: string;
    pickupLat?: number;
    pickupLng?: number;
    destLat?: number;
    destLng?: number;
    scheduledAt?: string;
  }
) {
  const activeRide = await prisma.ride.findFirst({
    where: {
      passengerId,
      status: { in: [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] },
    },
  });

  if (activeRide) {
    throw new Error("ACTIVE_RIDE_EXISTS");
  }

  const scheduledAt = parseScheduledAt(data.scheduledAt);
  const isImmediate = !scheduledAt;

  return prisma.ride.create({
    data: {
      passengerId,
      pickupLocation: data.pickupLocation,
      destinationLocation: data.destinationLocation,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      destLat: data.destLat,
      destLng: data.destLng,
      scheduledAt,
      driversNotifiedAt: isImmediate ? new Date() : null,
    },
    include: rideInclude,
  });
}

export function isRideVisibleToDrivers(ride: {
  scheduledAt: Date | null;
}): boolean {
  if (!ride.scheduledAt) return true;
  return ride.scheduledAt.getTime() <= Date.now();
}

export async function getRideById(rideId: string) {
  return prisma.ride.findUnique({
    where: { id: rideId },
    include: rideInclude,
  });
}

export async function getActiveRideForUser(userId: string, role: Role) {
  const where =
    role === Role.PASSENGER
      ? {
          passengerId: userId,
          status: { in: [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] },
        }
      : {
          driverId: userId,
          status: { in: [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] },
        };

  return prisma.ride.findFirst({
    where,
    include: rideInclude,
    orderBy: { requestedAt: "desc" },
  });
}

export async function getPendingRidesForDrivers(driverId: string) {
  const now = new Date();
  return prisma.ride.findMany({
    where: {
      status: RideStatus.REQUESTED,
      rejections: { none: { driverId } },
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    include: rideInclude,
    orderBy: [{ scheduledAt: "asc" }, { requestedAt: "desc" }],
  });
}

export async function activateDueScheduledRides() {
  const now = new Date();
  return prisma.ride.findMany({
    where: {
      status: RideStatus.REQUESTED,
      scheduledAt: { not: null, lte: now },
      driversNotifiedAt: null,
    },
    include: rideInclude,
  });
}

export async function markDriversNotified(rideId: string) {
  return prisma.ride.update({
    where: { id: rideId },
    data: { driversNotifiedAt: new Date() },
    include: rideInclude,
  });
}

export async function acceptRide(rideId: string, driverId: string) {
  const driverProfile = await prisma.driverProfile.findUnique({
    where: { userId: driverId },
  });

  if (!driverProfile?.isOnline) {
    throw new Error("DRIVER_OFFLINE");
  }

  const activeDriverRide = await prisma.ride.findFirst({
    where: {
      driverId,
      status: { in: [RideStatus.ACCEPTED, RideStatus.IN_PROGRESS] },
    },
  });

  if (activeDriverRide) {
    throw new Error("DRIVER_BUSY");
  }

  const result = await prisma.ride.updateMany({
    where: {
      id: rideId,
      status: RideStatus.REQUESTED,
      driverId: null,
    },
    data: {
      driverId,
      status: RideStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new Error("RIDE_UNAVAILABLE");
  }

  return getRideById(rideId);
}

export async function rejectRide(rideId: string, driverId: string) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new Error("NOT_FOUND");
  if (ride.status !== RideStatus.REQUESTED) throw new Error("INVALID_STATE");

  const driverProfile = await prisma.driverProfile.findUnique({
    where: { userId: driverId },
  });
  if (!driverProfile?.isOnline) throw new Error("DRIVER_OFFLINE");

  await prisma.rideRejection.upsert({
    where: { rideId_driverId: { rideId, driverId } },
    create: { rideId, driverId },
    update: {},
  });

  return { success: true };
}

export async function startRide(rideId: string, driverId: string) {
  const result = await prisma.ride.updateMany({
    where: {
      id: rideId,
      driverId,
      status: RideStatus.ACCEPTED,
    },
    data: {
      status: RideStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new Error("INVALID_STATE");
  }

  return getRideById(rideId);
}

export async function completeRide(rideId: string, driverId: string) {
  const result = await prisma.ride.updateMany({
    where: {
      id: rideId,
      driverId,
      status: RideStatus.IN_PROGRESS,
    },
    data: {
      status: RideStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new Error("INVALID_STATE");
  }

  return getRideById(rideId);
}

export async function cancelRide(
  rideId: string,
  userId: string,
  reason?: string
) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new Error("NOT_FOUND");

  const cancellable: RideStatus[] = [RideStatus.REQUESTED, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS];
  if (!cancellable.includes(ride.status)) {
    throw new Error("INVALID_STATE");
  }

  if (
    ride.passengerId !== userId &&
    ride.driverId !== userId
  ) {
    throw new Error("FORBIDDEN");
  }

  return prisma.ride.update({
    where: { id: rideId },
    data: {
      status: RideStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancelReason: reason,
    },
    include: rideInclude,
  });
}

export async function getRideHistory(userId: string, role: Role) {
  const where =
    role === Role.PASSENGER ? { passengerId: userId } : { driverId: userId };

  return prisma.ride.findMany({
    where: {
      ...where,
      status: { in: [RideStatus.COMPLETED, RideStatus.CANCELLED] },
    },
    include: rideInclude,
    orderBy: { requestedAt: "desc" },
    take: 50,
  });
}

export async function rateRide(
  rideId: string,
  passengerId: string,
  rating: number,
  feedback?: string
) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) throw new Error("NOT_FOUND");
  if (ride.passengerId !== passengerId) throw new Error("FORBIDDEN");
  if (ride.status !== RideStatus.COMPLETED) throw new Error("INVALID_STATE");
  if (!ride.driverId) throw new Error("NO_DRIVER");

  const existing = await prisma.rating.findUnique({ where: { rideId } });
  if (existing) throw new Error("ALREADY_RATED");

  return prisma.rating.create({
    data: {
      rideId,
      passengerId,
      driverId: ride.driverId,
      rating,
      feedback,
    },
  });
}
