import type { RowDataPacket } from "mysql2";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
}

export interface User extends AuthenticatedUser {
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  failedLoginAttempts: number;
  lockedUntil: string | null;
}

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  mfa_enabled: 0 | 1 | boolean;
  mfa_secret: string | null;
  failed_login_attempts: number;
  locked_until: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthSession {
  token: string;
  tokenId: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export interface TokenPayload {
  userId: number;
  name: string;
  email: string;
  tokenId: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetPayload {
  token: string;
  password: string;
}

export interface EnableMfaPayload {
  code: string;
}
