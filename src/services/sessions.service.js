import { usersRepository } from "../repositories/users.repository.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { signToken } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const sanitizeUser = (user) => ({
  id: user._id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
});

class SessionsService {
  async register({ first_name, last_name, email, password }) {
    if (!first_name || !last_name || !email || !password) {
      throw new AppError("Faltan campos obligatorios", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new AppError("El formato del email es inválido", 400);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`, 400);
    }

    const existingUser = await usersRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError("El email ya está registrado", 409);
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await usersRepository.create({
      first_name,
      last_name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return sanitizeUser(newUser);
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    return token;
  }
}

export const sessionsService = new SessionsService();
