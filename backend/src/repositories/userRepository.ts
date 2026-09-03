import type { ResultSetHeader } from "mysql2";
import { pool } from "../db/pool";
import { HttpError } from "../errors/httpError";
import type { AuthenticatedUser, UserRow, UserWithPassword } from "../types/auth";

export interface CreateUserRecordPayload {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  createUser(payload: CreateUserRecordPayload): Promise<AuthenticatedUser>;
  findUserByEmail(email: string): Promise<UserWithPassword | null>;
  findUserById(id: number): Promise<AuthenticatedUser | null>;
}

const toIsoString = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
};

const mapUserWithPassword = (row: UserRow): UserWithPassword => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at)
});

const mapAuthenticatedUser = (row: UserRow): AuthenticatedUser => ({
  id: row.id,
  name: row.name,
  email: row.email
});

const isDuplicateEmail = (error: unknown): boolean =>
  Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "ER_DUP_ENTRY"
  );

export const createUser = async (payload: CreateUserRecordPayload): Promise<AuthenticatedUser> => {
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [payload.name, payload.email, payload.passwordHash]
    );

    const user = await findUserById(result.insertId);

    if (!user) {
      throw new Error("Nao foi possivel carregar o usuario criado.");
    }

    return user;
  } catch (error) {
    if (isDuplicateEmail(error)) {
      throw new HttpError(409, "E-mail ja cadastrado.");
    }

    throw error;
  }
};

export const findUserByEmail = async (email: string): Promise<UserWithPassword | null> => {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, name, email, password_hash, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] ? mapUserWithPassword(rows[0]) : null;
};

export const findUserById = async (id: number): Promise<AuthenticatedUser | null> => {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, name, email, password_hash, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ? mapAuthenticatedUser(rows[0]) : null;
};

export const mysqlUserRepository: UserRepository = {
  createUser,
  findUserByEmail,
  findUserById
};
