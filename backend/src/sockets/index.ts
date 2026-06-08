import type { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../utils/jwt.js";
import { emitDriverStatus } from "./events.js";
import { updateDriverStatus } from "../services/driver.service.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as JwtPayload;
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
