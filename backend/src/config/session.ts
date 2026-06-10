import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Role } from "@prisma/client";

const PgSession = connectPgSimple(session);

export const SESSION_COOKIE_NAME = "campusride.sid";

const sessionDbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

function sessionPgConfig(connectionString: string | undefined) {
  if (!connectionString) return { connectionString };

  const isSupabase = connectionString.includes("supabase");
  if (!isSupabase) return { connectionString };

  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  };
}

export const sessionMiddleware = session({
  store: new PgSession({
    conObject: sessionPgConfig(sessionDbUrl),
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
