import { sessionsService } from "../services/sessions.service.js";
import { config } from "../config/config.js";

const COOKIE_MAX_AGE = 3600000;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: COOKIE_MAX_AGE,
  secure: config.nodeEnv === "production",
};

export const register = async (req, res) => {
  try {
    const user = await sessionsService.register(req.body);
    res.status(201).json({ status: "success", payload: user });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const token = await sessionsService.login(req.body);
    res.cookie("currentUser", token, cookieOptions);
    res.status(200).json({ status: "success", message: "Login correcto" });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

export const current = async (req, res) => {
  const { id, email, role } = req.user;
  res.status(200).json({ status: "success", payload: { id, email, role } });
};

export const logout = async (req, res) => {
  res.clearCookie("currentUser");
  res.status(200).json({ status: "success", message: "Sesión cerrada" });
};
