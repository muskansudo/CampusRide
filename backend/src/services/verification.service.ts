import { VerificationStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

export async function submitDriverVerification(
  userId: string,
  data: { licenseNumber: string; governmentIdNumber: string }
) {
  const profile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new Error("NOT_DRIVER");
  }
  if (profile.verificationStatus === VerificationStatus.VERIFIED) {
    throw new Error("ALREADY_VERIFIED");
  }

  return prisma.driverProfile.update({
    where: { userId },
    data: {
      licenseNumber: data.licenseNumber.trim(),
      governmentIdNumber: data.governmentIdNumber.trim(),
      verificationStatus: VerificationStatus.PENDING,
      verificationSubmittedAt: new Date(),
      verificationRejectionReason: null,
    },
  });
}

export async function getPendingVerifications() {
  return prisma.driverProfile.findMany({
    where: {
      verificationStatus: VerificationStatus.PENDING,
      verificationSubmittedAt: { not: null },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { verificationSubmittedAt: "asc" },
  });
}

export async function reviewDriverVerification(
  userId: string,
  status: "VERIFIED" | "REJECTED",
  rejectionReason?: string
) {
  const profile = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new Error("NOT_DRIVER");
  }
  if (!profile.verificationSubmittedAt) {
    throw new Error("NOT_SUBMITTED");
  }
  if (profile.verificationStatus !== VerificationStatus.PENDING) {
    throw new Error("NOT_PENDING");
  }

  return prisma.driverProfile.update({
    where: { userId },
    data: {
      verificationStatus: status,
      verificationRejectionReason:
        status === VerificationStatus.REJECTED
          ? rejectionReason?.trim() || "Verification rejected"
          : null,
      ...(status === VerificationStatus.REJECTED ? { isOnline: false } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });
}
