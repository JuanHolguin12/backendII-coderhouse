import { usersRepository } from "../repositories/users.repository.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";

class UsersService {
  async getAll() {
    const users = await usersRepository.findAll();
    return users.map(sanitizeUser);
  }
}

export const usersService = new UsersService();
