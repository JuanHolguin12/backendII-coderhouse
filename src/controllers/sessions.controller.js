import { config } from "../config/config.js";
import { signToken } from "../utils/jwt.js";

const COOKIE_MAX_AGE = 3600000;

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: COOKIE_MAX_AGE,
  secure: config.nodeEnv === "production",
};

export const register = (req, res) => {
  res.status(201).json({ status: "success", payload: req.user });
};

export const login = (req, res) => {
  const { _id, email, role } = req.user;
  const token = signToken({ id: _id, email, role });

  res.cookie("currentUser", token, cookieOptions);
  res.status(200).json({ status: "success", message: "Login correcto" });
};

export const current = (req, res) => {
  const { id, email, role } = req.user;
  res.status(200).json({ status: "success", payload: { id, email, role } });
};

export const logout = (req, res) => {
  res.clearCookie("currentUser");
  res.status(200).json({ status: "success", message: "Sesión cerrada" });
};
