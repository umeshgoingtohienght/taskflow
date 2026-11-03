import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

// Needed behind a hosting proxy (Render, Railway…) so rate limiting sees real client IPs
app.set("trust proxy", 1);

// CLIENT_URL may hold several comma-separated origins (e.g. local + Vercel)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(Object.assign(new Error("Origin not allowed by CORS"), { status: 403 })),
  })
);
app.use(express.json({ limit: "10kb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Brute-force protection on auth endpoints
app.use(
  "/api/auth",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false })
);

app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
