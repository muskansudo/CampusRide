import type { Server as SocketServer } from "socket.io";

export function emitRideEvent(io: SocketServer, event: string, payload: unknown) {
  io.emit(event, payload);

  const ride = payload as { id?: string; rideId?: string; passengerId?: string; driverId?: string };
  const rideId = ride.id || ride.rideId;
  if (rideId) {
    io.to(`ride:${rideId}`).emit(event, payload);
  }
  if (ride.passengerId) {
    io.to(`user:${ride.passengerId}`).emit(event, payload);
  }
  if (ride.driverId) {
    io.to(`user:${ride.driverId}`).emit(event, payload);
  }
}

export function emitDriverStatus(io: SocketServer, payload: unknown) {
  io.emit("driver:status:update", payload);
}

export function emitDriverLocation(
  io: SocketServer,
  payload: { driverId: string; passengerId: string; lat: number; lng: number }
) {
  io.to(`user:${payload.passengerId}`).emit("driver:location", payload);
}
