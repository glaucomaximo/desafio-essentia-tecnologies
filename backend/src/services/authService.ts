import { randomUUID } from "node:crypto";
import {
  createMfaSecret,
  createSecurityToken,
  hashSecurityToken,
  verifyTotpCode
} from "../auth/accountSecurity";
import { createJwtService, type JwtService } from "../auth/jwtService";
import { hashPassword, verifyPassword } from "../auth/passwordHash";
import { env } from "../config/env";
import { HttpError } from "../errors/httpError";
import { mysqlUserRepository, type UserRepository } from "../repositories/userRepository";
import type {
  AuthenticatedUser,
  AuthSession,
  EnableMfaPayload,
  LoginPayload,
  PasswordResetPayload,
  PasswordResetRequestPayload,
  RegisterUserPayload,
  UserWithPassword
} from "../types/auth";

export interface AuthService {
  register(payload: RegisterUserPayload): Promise<AuthSession>;
  login(payload: LoginPayload): Promise<AuthSession>;
  requestPasswordReset(payload: PasswordResetRequestPayload): Promise<{ resetToken?: string }>;
  resetPassword(payload: PasswordResetPayload): Promise<void>;
  beginMfaSetup(user: AuthenticatedUser): Promise<{ secret: string; otpauthUrl: string }>;
  enableMfa(user: AuthenticatedUser, payload: EnableMfaPayload): Promise<void>;
  logout(tokenId: string): Promise<void>;
  logoutAll(userId: number): Promise<void>;
}

const maxFailedAttempts = 5;
const resetTokenTtlMs = 15 * 60 * 1000;
const isDevelopment = env.nodeEnv !== "production";

const createSession = async (
  userRepository: UserRepository,
  jwtService: JwtService,
  user: AuthenticatedUser
): Promise<AuthSession> => {
  const tokenId = randomUUID();
  const signedToken = await jwtService.sign(user, tokenId);
  await userRepository.createTokenSession(tokenId, user.id, new Date(signedToken.expiresAt));

  return {
    ...signedToken,
    user
  };
};

const lockedUntilDate = (user: UserWithPassword): Date | null =>
  user.lockedUntil ? new Date(user.lockedUntil) : null;

const ensureAccountIsNotLocked = (user: UserWithPassword): void => {
  const lockedUntil = lockedUntilDate(user);

  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    throw new HttpError(423, "Conta temporariamente bloqueada. Tente novamente mais tarde.");
  }
};

const nextLockDate = (failedAttempts: number): Date | null => {
  if (failedAttempts < maxFailedAttempts) {
    return null;
  }

  const lockMinutes = Math.min(60, 2 ** Math.min(failedAttempts - maxFailedAttempts, 5));

  return new Date(Date.now() + lockMinutes * 60_000);
};

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

    return createSession(userRepository, jwtService, user);
  },

  async login(payload) {
    const user = await userRepository.findUserByEmail(payload.email);

    if (!user) {
      throw new HttpError(401, "Credenciais invalidas.");
    }

    ensureAccountIsNotLocked(user);

    if (!(await verifyPassword(payload.password, user.passwordHash))) {
      const failedAttempts = user.failedLoginAttempts + 1;
      await userRepository.updateLoginProtection(
        user.id,
        failedAttempts,
        nextLockDate(failedAttempts)
      );
      throw new HttpError(401, "Credenciais invalidas.");
    }

    if (user.mfaEnabled) {
      if (!user.mfaSecret || !payload.mfaCode) {
        throw new HttpError(401, "Codigo MFA obrigatorio.");
      }

      if (!verifyTotpCode(user.mfaSecret, payload.mfaCode)) {
        const failedAttempts = user.failedLoginAttempts + 1;
        await userRepository.updateLoginProtection(
          user.id,
          failedAttempts,
          nextLockDate(failedAttempts)
        );
        throw new HttpError(401, "Codigo MFA invalido.");
      }
    }

    await userRepository.updateLoginProtection(user.id, 0, null);

    return createSession(userRepository, jwtService, {
      id: user.id,
      name: user.name,
      email: user.email
    });
  },

  async requestPasswordReset(payload) {
    const user = await userRepository.findUserByEmail(payload.email);

    if (!user) {
      return {};
    }

    const resetToken = createSecurityToken();
    await userRepository.createPasswordResetToken(
      user.id,
      hashSecurityToken(resetToken),
      new Date(Date.now() + resetTokenTtlMs)
    );

    return isDevelopment ? { resetToken } : {};
  },

  async resetPassword(payload) {
    const user = await userRepository.consumePasswordResetToken(hashSecurityToken(payload.token));

    if (!user) {
      throw new HttpError(400, "Token de recuperacao invalido ou expirado.");
    }

    await userRepository.updatePassword(user.id, await hashPassword(payload.password));
    await userRepository.revokeUserTokens(user.id);
  },

  async beginMfaSetup(user) {
    const secret = createMfaSecret();
    await userRepository.updateMfaSecret(user.id, secret, false);

    return {
      secret,
      otpauthUrl: `otpauth://totp/TechX%20Tasks:${encodeURIComponent(user.email)}?secret=${secret}&issuer=TechX%20Tasks&algorithm=SHA1&digits=6&period=30`
    };
  },

  async enableMfa(user, payload) {
    const persistedUser = await userRepository.findUserById(user.id);
    const userWithSecret = persistedUser
      ? await userRepository.findUserByEmail(persistedUser.email)
      : null;

    if (!userWithSecret?.mfaSecret) {
      throw new HttpError(400, "Inicie a configuracao de MFA antes de habilitar.");
    }

    if (!verifyTotpCode(userWithSecret.mfaSecret, payload.code)) {
      throw new HttpError(400, "Codigo MFA invalido.");
    }

    await userRepository.updateMfaSecret(user.id, userWithSecret.mfaSecret, true);
  },

  async logout(tokenId) {
    await userRepository.revokeToken(tokenId);
  },

  async logoutAll(userId) {
    await userRepository.revokeUserTokens(userId);
  }
});

export const authService = createAuthService();
