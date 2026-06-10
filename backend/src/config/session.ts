import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Role } from "@prisma/client";

const PgSession = connectPgSimple(session);

export const SESSION_COOKIE_NAME = "campusride.sid";

export const sessionMiddleware = session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  }),
  secret:
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    "dev-session-secret-change-me",
  resave: false,
  saveUninitialized: false,
  name: SESSION_COOKIE_NAME,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
});

declare module "express-session" {
  interface SessionData {
    userId: string;
    email: string;
    role: Role;
  }
}

export function establishSession(
  req: import("express").Request,
  user: { id: string; email: string; role: Role }
) {
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;
}
