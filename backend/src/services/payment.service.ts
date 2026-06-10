import { prisma } from '../utils/prisma.js';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateFare(
  pickupLat?: number | null,
  pickupLng?: number | null,
  destLat?: number | null,
  destLng?: number | null
): number {
  if (pickupLat != null && pickupLng != null && destLat != null && destLng != null) {
    const km = haversineKm(pickupLat, pickupLng, destLat, destLng);
    const fare = 10 + km * 5;
    return Math.max(10, Math.round(fare / 5) * 5);
  }
  return 20;
}

export async function createPaymentForRide(rideId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { passengerId: true, driverId: true, pickupLat: true, pickupLng: true, destLat: true, destLng: true },
  });

  if (!ride || !ride.driverId) return null;

  const amount = calculateFare(ride.pickupLat, ride.pickupLng, ride.destLat, ride.destLng);

  return prisma.payment.upsert({
    where: { rideId },
    update: {},
    create: {
      rideId,
      passengerId: ride.passengerId,
      driverId: ride.driverId,
      amount,
      status: PaymentStatus.PENDING,
    },
  });
}

export async function completePayment(
  paymentId: string,
  passengerId: string,
  method: PaymentMethod,
  upiTransactionId?: string
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, passengerId, status: PaymentStatus.PENDING },
  });
  if (!payment) throw new Error('PAYMENT_NOT_FOUND');

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.COMPLETED,
      method,
      upiTransactionId: upiTransactionId || null,
      completedAt: new Date(),
    },
  });
}

export async function getPaymentByRide(rideId: string) {
  return prisma.payment.findUnique({ where: { rideId } });
}

export async function getPassengerPaymentHistory(passengerId: string) {
  return prisma.payment.findMany({
    where: { passengerId },
    orderBy: { createdAt: 'desc' },
    include: {
      ride: {
        select: { pickupLocation: true, destinationLocation: true, completedAt: true },
      },
      driver: { select: { name: true } },
    },
  });
}

export async function getDriverPaymentHistory(driverId: string) {
  return prisma.payment.findMany({
    where: { driverId },
    orderBy: { createdAt: 'desc' },
    include: {
      ride: {
        select: { pickupLocation: true, destinationLocation: true, completedAt: true },
      },
      passenger: { select: { name: true } },
    },
  });
}
