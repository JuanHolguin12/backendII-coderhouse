import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { usersRepository } from "../repositories/users.repository.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { verifyToken } from "../utils/jwt.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";

const { Strategy } = passport;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

class CurrentStrategy extends Strategy {
  authenticate(req) {
    const token = req.cookies?.currentUser;

    if (!token) {
      return this.fail({ statusCode: 401, message: "No autenticado" });
    }

    try {
      const payload = verifyToken(token);
      return this.success({ id: payload.id, email: payload.email, role: payload.role });
    } catch (error) {
      return this.fail({ statusCode: 401, message: "No autenticado" });
    }
  }
}

const registerStrategy = new LocalStrategy(
  { usernameField: "email", passwordField: "password", passReqToCallback: true },
  async (req, email, password, done) => {
    try {
      const { first_name, last_name } = req.body;

      if (!first_name || !last_name || !email || !password) {
        return done(null, false, { statusCode: 400, message: "Faltan campos obligatorios" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return done(null, false, { statusCode: 400, message: "El formato del email es inválido" });
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return done(null, false, {
          statusCode: 400,
          message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
        });
      }

      const existingUser = await usersRepository.findByEmail(normalizedEmail);
      if (existingUser) {
        return done(null, false, { statusCode: 409, message: "El email ya está registrado" });
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await usersRepository.create({
        first_name,
        last_name,
        email: normalizedEmail,
        password: hashedPassword,
      });

      return done(null, sanitizeUser(newUser));
    } catch (error) {
      return done(error);
    }
  }
);

const loginStrategy = new LocalStrategy(
  { usernameField: "email", passwordField: "password" },
  async (email, password, done) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await usersRepository.findByEmail(normalizedEmail);
      if (!user) {
        return done(null, false, { statusCode: 401, message: "Credenciales inválidas" });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { statusCode: 401, message: "Credenciales inválidas" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

export const initPassport = () => {
  passport.use("register", registerStrategy);
  passport.use("login", loginStrategy);
  passport.use("current", new CurrentStrategy());

  // Punto de extensión para futuras estrategias (Google, GitHub, etc.):
  // passport.use("google", new GoogleStrategy({ ... }, verifyCallback));
};
