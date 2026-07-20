import { usersDao } from "../dao/users.dao.js";

class UsersRepository {
  async findByEmail(email) {
    return usersDao.findByEmail(email);
  }

  async create(userData) {
    return usersDao.create(userData);
  }

  async findAll() {
    return usersDao.findAll();
  }
}

export const usersRepository = new UsersRepository();
