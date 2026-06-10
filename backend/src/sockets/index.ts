import type { Server as HttpServer } from "http";
import type { Request } from "express";
import type { IncomingMessage } from "http";
import { Server as SocketServer } from "socket.io";
import type { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { emitDriverStatus } from "./events.js";
import { updateDriverStatus } from "../services/driver.service.js";

type SocketSessionRequest = IncomingMessage & {
  session?: {
    userId?: string;
    email?: string;
    role?: Role;
  };
};

function wrapSessionMiddleware(middleware: RequestHandler) {
  return (socket: { request: SocketSessionRequest }, next: (err?: Error) => void) => {
    middleware(socket.request as Request, {} as import("express").Response, next as NextFunction);
  };
}

type NextFunction = (err?: unknown) => void;

export function initSocketServer(
  httpServer: HttpServer,
  sessionMiddleware: RequestHandler
): SocketServer {
  const clientOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
    : ["http://localhost:5173"];

  const io = new SocketServer(httpServer, {
    cors: {
      origin: clientOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(wrapSessionMiddleware(sessionMiddleware));

  io.use((socket, next) => {
    const session = (socket.request as SocketSessionRequest).session;
    if (!session?.userId || !session.role || !session.email) {
      return next(new Error("Authentication required"));
    }
    socket.data.user = {
      userId: session.userId,
      email: session.email,
      role: session.role,
    };
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as {
      userId: string;
      email: string;
      role: Role;
    };
    socket.join(`user:${user.userId}`);

    if (user.role === "DRIVER") {
      socket.join("drivers:online");
    }

    socket.on("ride:join", (rideId: string) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on("driver:status", async (data: { isOnline: boolean }) => {
      if (user.role !== "DRIVER") return;
      try {
        const profile = await updateDriverStatus(user.userId, data.isOnline);
        emitDriverStatus(io, {
          driverId: user.userId,
          isOnline: profile.isOnline,
          name: profile.user.name,
        });
      } catch (err) {
        console.error("Failed to update driver status:", err);
      }
    });

    socket.on("disconnect", async () => {
      if (user.role === "DRIVER") {
        try {
          await updateDriverStatus(user.userId, false);
          emitDriverStatus(io, {
            driverId: user.userId,
            isOnline: false,
          });
        } catch {
          // ignore on disconnect
        }
      }
    });
  });

  return io;
}
