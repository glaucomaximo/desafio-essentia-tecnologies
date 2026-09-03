import { createJwtService, type JwtService } from "../auth/jwtService";
import { hashPassword, verifyPassword } from "../auth/passwordHash";
import { env } from "../config/env";
import { HttpError } from "../errors/httpError";
import { mysqlUserRepository, type UserRepository } from "../repositories/userRepository";
import type { AuthSession, LoginPayload, RegisterUserPayload } from "../types/auth";

export interface AuthService {
  register(payload: RegisterUserPayload): Promise<AuthSession>;
  login(payload: LoginPayload): Promise<AuthSession>;
}

export const createAuthService = (
  userRepository: UserRepository = mysqlUserRepository,
  jwtService: JwtService = createJwtService(env.auth)
): AuthService => ({
  async register(payload) {
    const existingUser = await userRepository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new HttpError(409, "E-mail ja cadastrado.");
    }

    const user = await userRepository.createUser({
      name: payload.name,
      email: payload.email,
      passwordHash: await hashPassword(payload.password)
    });
    const signedToken = await jwtService.sign(user);

    return {
      ...signedToken,
      user
    };
  },

  async login(payload) {
    const user = await userRepository.findUserByEmail(payload.email);

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      throw new HttpError(401, "Credenciais invalidas.");
    }

    const signedToken = await jwtService.sign(user);

    return {
      ...signedToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
  }
});

export const authService = createAuthService();
