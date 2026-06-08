import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/rides", rideRoutes);

app.use(errorHandler);

export default app;
