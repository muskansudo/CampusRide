import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { registerUser, loginUser, getUserById, updateUserProfile } from "../services/auth.service.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  licenseInfo: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_EXISTS") {
      return res.status(409).json({ error: "Email already registered" });
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data.email, data.password);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    next(err);
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.put("/profile", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = z
      .object({ name: z.string().min(2).optional(), phone: z.string().optional() })
      .parse(req.body);
    const user = await updateUserProfile(req.user!.userId, data);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
