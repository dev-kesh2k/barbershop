import express from "express";
import cors from "cors";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import barbershopsRouter from "./routes/barbershops";
import bookingsRouter from "./routes/bookings";
import profileRouter from "./routes/profile";
import adminRouter from "./routes/admin";
import { errorHandler } from "./lib/async";
import { uploadsPath } from "./lib/uploads";

const app = express();

const trustProxy = process.env.TRUST_PROXY?.trim();
if (trustProxy && trustProxy !== "false" && trustProxy !== "0") {
  // Hub injeta CIDR (ex.: 172.16.0.0/12) ou true/1
  app.set(
    "trust proxy",
    trustProxy === "true" || trustProxy === "1" ? 1 : trustProxy,
  );
}

const corsOrigins = process.env.CORS_ORIGINS?.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins?.length ? corsOrigins : "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use("/uploads", express.static(uploadsPath));

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/barbershops", barbershopsRouter);
app.use("/bookings", bookingsRouter);
app.use("/profile", profileRouter);
app.use("/admin", adminRouter);

app.use(errorHandler);

export default app;
