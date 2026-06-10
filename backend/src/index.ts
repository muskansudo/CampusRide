import "dotenv/config";
import { createServer } from "http";
import app, { sessionMiddleware } from "./app.js";
import { initSocketServer } from "./sockets/index.js";
import { setRideSocketServer } from "./routes/ride.routes.js";
import { setDriverSocketServer } from "./routes/driver.routes.js";
import { startScheduledRidePoller } from "./services/scheduler.service.js";

const PORT = Number(process.env.PORT) || 3001;

const httpServer = createServer(app);
const io = initSocketServer(httpServer, sessionMiddleware);
setRideSocketServer(io);
setDriverSocketServer(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startScheduledRidePoller(io);
});
