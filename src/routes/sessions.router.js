import { Router } from "express";
import passport from "passport";
import { register, login, current, logout } from "../controllers/sessions.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

const authenticate = (strategy, fallback) => (req, res, next) => {
  passport.authenticate(strategy, { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      const statusCode = info?.statusCode || fallback.statusCode;
      const message = info?.statusCode ? info.message : fallback.message;
      return res.status(statusCode).json({ status: "error", message });
    }

    req.user = user;
    next();
  })(req, res, next);
};

router.post(
  "/register",
  authenticate("register", { statusCode: 400, message: "Faltan campos obligatorios" }),
  register
);

router.post(
  "/login",
  authenticate("login", { statusCode: 401, message: "Credenciales inválidas" }),
  login
);

router.get("/current", auth, current);

router.post("/logout", logout);

export default router;
