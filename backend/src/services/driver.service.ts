import { VerificationStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

export async function updateDriverStatus(userId: string, isOnline: boolean) {
  const profile = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("NOT_DRIVER");
  }

  if (isOnline && profile.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new Error("NOT_VERIFIED");
  }

  return prisma.driverProfile.update({
    where: { userId },
    data: { isOnline },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });
}

export async function updateVehicleInfo(
  userId: string,
  data: {
    vehicleType?: string;
    vehicleNumber?: string;
  }
) {
  return prisma.driverProfile.update({
    where: { userId },
    data,
  });
}

export async function getAvailableDrivers() {
  return prisma.driverProfile.findMany({
    where: { isOnline: true },
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
    },
  });
}

export async function updateDriverLocation(userId: string, lat: number, lng: number) {
  const [profile, activeRide] = await Promise.all([
    prisma.driverProfile.update({
      where: { userId },
      data: { currentLat: lat, currentLng: lng },
    }),
    prisma.ride.findFirst({
      where: { driverId: userId, status: { in: ["ACCEPTED", "IN_PROGRESS"] } },
      select: { id: true, passengerId: true },
    }),
  ]);
  return { profile, activeRide };
}

export async function getDriverAnalytics(userId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const campusDemandStatuses = [
    "COMPLETED",
    "IN_PROGRESS",
    "ACCEPTED",
    "REQUESTED",
  ] as const;

  const [
    totalRidesCompleted,
    totalCancelled,
    allRatings,
    ridesThisWeek,
    recentRidesForChart,
    activityRides,
    recentRatings,
    fullHistory,
    platformDemandRides,
  ] = await Promise.all([
    prisma.ride.count({ where: { driverId: userId, status: "COMPLETED" } }),
    prisma.ride.count({ where: { driverId: userId, status: "CANCELLED" } }),
    prisma.rating.findMany({ where: { driverId: userId } }),
    prisma.ride.count({
      where: {
        driverId: userId,
        status: "COMPLETED",
        requestedAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.ride.findMany({
      where: {
        driverId: userId,
        status: { in: ["COMPLETED", "CANCELLED"] },
        requestedAt: { gte: sevenDaysAgo },
      },
      select: { id: true, requestedAt: true },
    }),
    prisma.ride.findMany({
      where: { driverId: userId, status: { in: ["COMPLETED", "CANCELLED"] } },
      orderBy: { requestedAt: "desc" },
      take: 10,
      include: {
        passenger: { select: { name: true } },
        rating: { select: { rating: true } },
      },
    }),
    prisma.rating.findMany({
      where: { driverId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        passenger: { select: { name: true } },
        ride: { select: { pickupLocation: true, destinationLocation: true } },
      },
    }),
    prisma.ride.findMany({
      where: { driverId: userId, status: { in: ["COMPLETED", "CANCELLED"] } },
      orderBy: { requestedAt: "desc" },
      take: 50,
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
        rating: true,
      },
    }),
    prisma.ride.findMany({
      where: { status: { in: [...campusDemandStatuses] } },
      select: {
        requestedAt: true,
        scheduledAt: true,
        pickupLocation: true,
        destinationLocation: true,
      },
    }),
  ]);

  const avgRating =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

  const completionRate =
    totalRidesCompleted + totalCancelled > 0
      ? (totalRidesCompleted / (totalRidesCompleted + totalCancelled)) * 100
      : 0;

  // Build 7-day chart data (bucket in JS to avoid DATE_TRUNC)
  const days: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      count: 0,
    });
  }
  for (const ride of recentRidesForChart) {
    const dayStr = ride.requestedAt.toISOString().slice(0, 10);
    const entry = days.find((d) => d.date === dayStr);
    if (entry) entry.count++;
  }

  const activityLog = activityRides.map((ride) => ({
    id: ride.id,
    date: ride.requestedAt.toISOString(),
    passengerName: ride.passenger.name,
    passengerId: ride.passengerId,
    driverId: ride.driverId,
    pickupLocation: ride.pickupLocation,
    destinationLocation: ride.destinationLocation,
    status: ride.status,
    cancelledBy: ride.cancelledBy,
    rating: ride.rating?.rating ?? null,
  }));

  const hourBuckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }));
  const pickupCounts = new Map<string, number>();
  const destCounts = new Map<string, number>();

  for (const ride of platformDemandRides) {
    const demandAt = ride.scheduledAt ?? ride.requestedAt;
    const hour = demandAt.getHours();
    hourBuckets[hour].count++;

    pickupCounts.set(
      ride.pickupLocation,
      (pickupCounts.get(ride.pickupLocation) ?? 0) + 1
    );
    destCounts.set(
      ride.destinationLocation,
      (destCounts.get(ride.destinationLocation) ?? 0) + 1
    );
  }

  const toHotspots = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

  const peakHours = hourBuckets
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    totalRidesCompleted,
    totalCancelled,
    averageRating: Math.round(avgRating * 10) / 10,
    totalRatings: allRatings.length,
    ridesThisWeek,
    completionRate: Math.round(completionRate * 10) / 10,
    dailyRides: days,
    activityLog,
    recentRatings,
    fullHistory,
    peakHours,
    pickupHotspots: toHotspots(pickupCounts),
    destinationHotspots: toHotspots(destCounts),
    campusDemandRideCount: platformDemandRides.length,
  };
}

export async function getDriverDashboard(userId: string) {
  const profile = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!profile) throw new Error("NOT_DRIVER");

  const [completedRides, activeRides, ratings, recentRides] = await Promise.all([
    prisma.ride.count({
      where: { driverId: userId, status: "COMPLETED" },
    }),
    prisma.ride.findMany({
      where: {
        driverId: userId,
        status: { in: ["ACCEPTED", "IN_PROGRESS"] },
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
      },
    }),
    prisma.rating.findMany({
      where: { driverId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        passenger: { select: { name: true } },
        ride: { select: { pickupLocation: true, destinationLocation: true } },
      },
    }),
    prisma.ride.findMany({
      where: {
        driverId: userId,
        status: { in: ["COMPLETED", "CANCELLED"] },
      },
      orderBy: { requestedAt: "desc" },
      take: 10,
      include: {
        passenger: { select: { name: true } },
        rating: true,
      },
    }),
  ]);

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  return {
    isOnline: profile.isOnline,
    vehicleType: profile.vehicleType,
    vehicleNumber: profile.vehicleNumber,
    totalRidesCompleted: completedRides,
    activeRides,
    averageRating: Math.round(avgRating * 10) / 10,
    totalRatings: ratings.length,
    recentRatings: ratings.slice(0, 5),
    rideHistory: recentRides,
  };
}
