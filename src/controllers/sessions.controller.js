import { sessionsService } from "../services/sessions.service.js";

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
  res.status(501).json({ status: "error", message: "Not implemented yet" });
};
