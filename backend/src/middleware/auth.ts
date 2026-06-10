import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: Role;
  };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.session?.userId || !req.session.role || !req.session.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  req.user = {
    userId: req.session.userId,
    email: req.session.email,
    role: req.session.role,
  };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
