import { usersRepository } from "../repositories/users.repository.js";
import { UserDto } from "../dto/user.dto.js";

class UsersService {
  async getAll() {
    const users = await usersRepository.findAll();
    return users.map((user) => new UserDto(user));
  }
}

export const usersService = new UsersService();
