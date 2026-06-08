import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import {
  createRide,
  getRideById,
  getActiveRideForUser,
  getPendingRidesForDrivers,
  acceptRide,
  rejectRide,
  startRide,
  completeRide,
  cancelRide,
  getRideHistory,
  rateRide,
} from "../services/ride.service.js";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import type { Server as SocketServer } from "socket.io";
import { emitRideEvent } from "../sockets/events.js";

const router = Router();

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

let io: SocketServer | null = null;

export function setRideSocketServer(socketServer: SocketServer) {
  io = socketServer;
}

const createRideSchema = z.object({
  pickupLocation: z.string().min(2),
  destinationLocation: z.string().min(2),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  destLat: z.number().optional(),
  destLng: z.number().optional(),
});

router.post(
  "/",
  authenticate,
  requireRole(Role.PASSENGER),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createRideSchema.parse(req.body);
      const ride = await createRide(req.user!.userId, data);
      if (io) emitRideEvent(io, "ride:requested", ride);
      res.status(201).json(ride);
    } catch (err) {
      if (err instanceof Error && err.message === "ACTIVE_RIDE_EXISTS") {
        return res.status(409).json({ error: "You already have an active ride" });
      }
      next(err);
    }
  }
);

router.get("/active", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const ride = await getActiveRideForUser(req.user!.userId, req.user!.role);
    res.json(ride);
  } catch (err) {
    next(err);
  }
});

router.get(
  "/pending",
  authenticate,
  requireRole(Role.DRIVER),
  async (_req, res, next) => {
    try {
      const rides = await getPendingRidesForDrivers();
      res.json(rides);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/history", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rides = await getRideHistory(req.user!.userId, req.user!.role);
    res.json(rides);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const ride = await getRideById(paramId(req.params.id));
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json(ride);
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id/accept",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const ride = await acceptRide(paramId(req.params.id), req.user!.userId);
      if (io) emitRideEvent(io, "ride:accepted", ride);
      res.json(ride);
    } catch (err) {
      if (err instanceof Error) {
        const map: Record<string, string> = {
          DRIVER_OFFLINE: "Go online to accept rides",
          DRIVER_BUSY: "You already have an active ride",
          RIDE_UNAVAILABLE: "Ride is no longer available",
        };
        if (map[err.message]) {
          return res.status(409).json({ error: map[err.message] });
        }
      }
      next(err);
    }
  }
);

router.put(
  "/:id/reject",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const rideId = paramId(req.params.id);
      await rejectRide(rideId, req.user!.userId);
      if (io) {
        emitRideEvent(io, "ride:rejected", {
          rideId,
          driverId: req.user!.userId,
        });
      }
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id/start",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const ride = await startRide(paramId(req.params.id), req.user!.userId);
      if (io) emitRideEvent(io, "ride:status:update", ride);
      res.json(ride);
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_STATE") {
        return res.status(409).json({ error: "Cannot start this ride" });
      }
      next(err);
    }
  }
);

router.put(
  "/:id/complete",
  authenticate,
  requireRole(Role.DRIVER),
  async (req: AuthRequest, res, next) => {
    try {
      const ride = await completeRide(paramId(req.params.id), req.user!.userId);
      if (io) emitRideEvent(io, "ride:status:update", ride);
      res.json(ride);
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_STATE") {
        return res.status(409).json({ error: "Cannot complete this ride" });
      }
      next(err);
    }
  }
);

router.put("/:id/cancel", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const ride = await cancelRide(paramId(req.params.id), req.user!.userId, reason);
    if (io) emitRideEvent(io, "ride:cancelled", ride);
    res.json(ride);
  } catch (err) {
    if (err instanceof Error) {
      const map: Record<string, [number, string]> = {
        NOT_FOUND: [404, "Ride not found"],
        INVALID_STATE: [409, "Cannot cancel this ride"],
        FORBIDDEN: [403, "Not authorized to cancel this ride"],
      };
      const entry = map[err.message];
      if (entry) return res.status(entry[0]).json({ error: entry[1] });
    }
    next(err);
  }
});

router.post(
  "/:id/rate",
  authenticate,
  requireRole(Role.PASSENGER),
  async (req: AuthRequest, res, next) => {
    try {
      const { rating, feedback } = z
        .object({
          rating: z.number().int().min(1).max(5),
          feedback: z.string().optional(),
        })
        .parse(req.body);
      const result = await rateRide(
        paramId(req.params.id),
        req.user!.userId,
        rating,
        feedback
      );
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof Error) {
        const map: Record<string, [number, string]> = {
          NOT_FOUND: [404, "Ride not found"],
          FORBIDDEN: [403, "Not authorized"],
          INVALID_STATE: [409, "Ride must be completed before rating"],
          NO_DRIVER: [409, "No driver assigned"],
          ALREADY_RATED: [409, "Ride already rated"],
        };
        const entry = map[err.message];
        if (entry) return res.status(entry[0]).json({ error: entry[1] });
      }
      next(err);
    }
  }
);

export default router;
