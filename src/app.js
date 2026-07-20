import express from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import healthRouter from "./routes/health.router.js";
import eventsRouter from "./routes/events.router.js";
import sessionsRouter from "./routes/sessions.router.js";
import usersRouter from "./routes/users.router.js";
import { initPassport } from "./config/passport.config.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

initPassport();
app.use(passport.initialize());

app.use("/api/health", healthRouter);
app.use("/api/events", eventsRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/users", usersRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ status: "error", message: err.message || "Error interno del servidor" });
});

export default app;
