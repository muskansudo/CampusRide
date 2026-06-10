import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import {
  updateDriverStatus,
  updateVehicleInfo,
  getAvailableDrivers,
  getDriverDashboard,
  updateDriverLocation,
  getDriverAnalytics,
  updateDriverUpiId,
} from "../services/driver.service.js";
import { submitDriverVerification } from "../services/verification.service.js";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import type { Server as SocketServer } from "socket.io";
import { emitDriverLocation } from "../sockets/events.js";

const router = Router();

let io: SocketServer | null = null;

export function setDriverSocketServer(socketServer: SocketServer) {
  io = socketServer;
}

router.put(
  "/location",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const { lat, lng } = z.object({ lat: z.number(), lng: z.number() }).parse(req.body);
      const { profile, activeRide } = await updateDriverLocation(req.user!.userId, lat, lng);
      if (io && activeRide) {
        emitDriverLocation(io, {
          driverId: req.user!.userId,
          passengerId: activeRide.passengerId,
          lat,
          lng,
        });
      }
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/analytics",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const analytics = await getDriverAnalytics(req.user!.userId);
      res.json(analytics);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/available", authenticate, async (_req, res, next) => {
  try {
    const drivers = await getAvailableDrivers();
    res.json(drivers);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/status",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const { isOnline } = z.object({ isOnline: z.boolean() }).parse(req.body);
      const profile = await updateDriverStatus(req.user!.userId, isOnline);
      res.json(profile);
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_DRIVER") {
        return res.status(403).json({ error: "Not a driver account" });
      }
      if (err instanceof Error && err.message === "NOT_VERIFIED") {
        return res.status(403).json({
          error: "Driver verification required before going online",
        });
      }
      next(err);
    }
  }
);

router.put(
  "/verification",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const data = z
        .object({
          licenseNumber: z.string().min(3),
          governmentIdNumber: z.string().min(3),
        })
        .parse(req.body);
      const profile = await submitDriverVerification(req.user!.userId, data);
      res.json(profile);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "NOT_DRIVER") {
          return res.status(403).json({ error: "Not a driver account" });
        }
        if (err.message === "ALREADY_VERIFIED") {
          return res.status(400).json({ error: "Already verified" });
        }
      }
      next(err);
    }
  }
);

router.put(
  "/upi",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const { upiId } = z.object({ upiId: z.string().min(3) }).parse(req.body);
      const profile = await updateDriverUpiId(req.user!.userId, upiId);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/vehicle",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const data = z
        .object({
          vehicleType: z.string().optional(),
          vehicleNumber: z.string().optional(),
        })
        .parse(req.body);
      const profile = await updateVehicleInfo(req.user!.userId, data);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/dashboard",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const dashboard = await getDriverDashboard(req.user!.userId);
      res.json(dashboard);
    } catch (err) {
      if (err instanceof Error && err.message === "NOT_DRIVER") {
        return res.status(403).json({ error: "Not a driver account" });
      }
      next(err);
    }
  }
);

export default router;
