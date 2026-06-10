import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: Role;
  vehicleType?: string;
  vehicleNumber?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone,
      role: data.role,
      ...(data.role === Role.DRIVER && {
        driverProfile: {
          create: {
            vehicleType: data.vehicleType || "E-Rickshaw",
            vehicleNumber: data.vehicleNumber || "TBD",
          },
        },
      }),
    },
    include: { driverProfile: true },
  });

  return { user: sanitizeUser(user) };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { driverProfile: true },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return { user: sanitizeUser(user) };
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: data.name, phone: data.phone },
    include: { driverProfile: true },
  });
  return sanitizeUser(user);
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driverProfile: true },
  });

  if (!user) return null;
  return sanitizeUser(user);
}

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
  driverProfile?: unknown;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    driverProfile: user.driverProfile ?? null,
  };
}
