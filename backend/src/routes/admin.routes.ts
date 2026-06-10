import { Router } from "express";
import { z } from "zod";
import { Role, VerificationStatus } from "@prisma/client";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import {
  getPendingVerifications,
  reviewDriverVerification,
} from "../services/verification.service.js";

const router = Router();

router.get(
  "/verifications/pending",
  authenticate,
  requireRole(Role.ADMIN),
  async (_req, res, next) => {
    try {
      const pending = await getPendingVerifications();
      res.json(pending);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/verifications/:userId",
  authenticate,
  requireRole(Role.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const { status, rejectionReason } = z
        .object({
          status: z.enum([VerificationStatus.VERIFIED, VerificationStatus.REJECTED]),
          rejectionReason: z.string().optional(),
        })
        .parse(req.body);

      const userId = z.string().parse(req.params.userId);
      const profile = await reviewDriverVerification(userId, status, rejectionReason);
      res.json(profile);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "NOT_DRIVER") {
          return res.status(404).json({ error: "Driver not found" });
        }
        if (err.message === "NOT_SUBMITTED") {
          return res.status(400).json({ error: "Driver has not submitted verification" });
        }
        if (err.message === "NOT_PENDING") {
          return res.status(400).json({ error: "Verification is not pending review" });
        }
      }
      next(err);
    }
  }
);

export default router;
