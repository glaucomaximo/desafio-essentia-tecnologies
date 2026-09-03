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
}

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
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
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export interface TokenPayload {
  userId: number;
  name: string;
  email: string;
}
