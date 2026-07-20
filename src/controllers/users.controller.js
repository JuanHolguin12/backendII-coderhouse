import { usersService } from "../services/users.service.js";

export const getUsers = async (req, res) => {
  try {
    const users = await usersService.getAll();
    res.status(200).json({ status: "success", payload: users });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};
