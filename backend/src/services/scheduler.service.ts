import type { Server as SocketServer } from "socket.io";
import {
  activateDueScheduledRides,
  markDriversNotified,
} from "./ride.service.js";
import { emitRideEvent } from "../sockets/events.js";

export function startScheduledRidePoller(io: SocketServer) {
  const tick = async () => {
    try {
      const dueRides = await activateDueScheduledRides();
      for (const ride of dueRides) {
        const updated = await markDriversNotified(ride.id);
        emitRideEvent(io, "ride:requested", updated);
      }
    } catch (err) {
      console.error("Scheduled ride poller error:", err);
    }
  };

  tick();
  return setInterval(tick, 30_000);
}
