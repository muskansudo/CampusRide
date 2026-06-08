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
          licenseInfo: "DL-123456",
          verificationStatus: "VERIFIED",
          isOnline: false,
        },
      },
    },
  });

  console.log("Seed data created:");
  console.log({ passenger: passenger.email, driver: driver.email });
  console.log("Password for both: password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
