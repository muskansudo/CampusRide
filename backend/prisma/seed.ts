import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const passenger = await prisma.user.upsert({
    where: { email: "passenger@test.com" },
    update: {},
    create: {
      email: "passenger@test.com",
      passwordHash,
      name: "Test Passenger",
      phone: "9876543210",
      role: Role.PASSENGER,
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: "driver@test.com" },
    update: {},
    create: {
      email: "driver@test.com",
      passwordHash,
      name: "Test Driver",
      phone: "9876543211",
      role: Role.DRIVER,
      driverProfile: {
        create: {
          vehicleType: "E-Rickshaw",
          vehicleNumber: "UK-01-AB-1234",
          licenseNumber: "DL-123456",
          governmentIdNumber: "GOV-987654",
          verificationStatus: "VERIFIED",
          verificationSubmittedAt: new Date(),
          isOnline: false,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      passwordHash,
      name: "Campus Admin",
      phone: "9876543212",
      role: Role.ADMIN,
    },
  });

  await prisma.driverProfile.updateMany({
    where: { user: { email: "driver@test.com" } },
    data: {
      licenseNumber: "DL-123456",
      governmentIdNumber: "GOV-987654",
      upiId: "testdriver@paytm",
      verificationStatus: "VERIFIED",
      verificationSubmittedAt: new Date(),
    },
  });

  console.log("Seed data created:");
  console.log({
    passenger: passenger.email,
    driver: driver.email,
    admin: "admin@test.com",
  });
  console.log("Password for all: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
