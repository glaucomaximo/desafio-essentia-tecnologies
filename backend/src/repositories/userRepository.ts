import type { ResultSetHeader, RowDataPacket } from "mysql2";
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
  updatePassword(userId: number, passwordHash: string): Promise<void>;
  updateLoginProtection(
    userId: number,
    failedAttempts: number,
    lockedUntil: Date | null
  ): Promise<void>;
  updateMfaSecret(userId: number, secret: string | null, enabled: boolean): Promise<void>;
  createTokenSession(tokenId: string, userId: number, expiresAt: Date): Promise<void>;
  isTokenRevoked(tokenId: string): Promise<boolean>;
  revokeToken(tokenId: string): Promise<void>;
  revokeUserTokens(userId: number): Promise<void>;
  createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void>;
  consumePasswordResetToken(tokenHash: string): Promise<UserWithPassword | null>;
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
  mfaEnabled: Boolean(row.mfa_enabled),
  mfaSecret: row.mfa_secret,
  failedLoginAttempts: row.failed_login_attempts,
  lockedUntil: row.locked_until ? toIsoString(row.locked_until) : null,
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
    `SELECT id, name, email, password_hash, mfa_enabled, mfa_secret,
        failed_login_attempts, locked_until, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] ? mapUserWithPassword(rows[0]) : null;
};

export const findUserById = async (id: number): Promise<AuthenticatedUser | null> => {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, name, email, password_hash, mfa_enabled, mfa_secret,
        failed_login_attempts, locked_until, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ? mapAuthenticatedUser(rows[0]) : null;
};

export const updatePassword = async (userId: number, passwordHash: string): Promise<void> => {
  await pool.execute(
    `UPDATE users
     SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL
     WHERE id = ?`,
    [passwordHash, userId]
  );
};

export const updateLoginProtection = async (
  userId: number,
  failedAttempts: number,
  lockedUntil: Date | null
): Promise<void> => {
  await pool.execute(
    `UPDATE users
     SET failed_login_attempts = ?, locked_until = ?
     WHERE id = ?`,
    [failedAttempts, lockedUntil, userId]
  );
};

export const updateMfaSecret = async (
  userId: number,
  secret: string | null,
  enabled: boolean
): Promise<void> => {
  await pool.execute(
    `UPDATE users
     SET mfa_secret = ?, mfa_enabled = ?
     WHERE id = ?`,
    [secret, enabled, userId]
  );
};

export const createTokenSession = async (
  tokenId: string,
  userId: number,
  expiresAt: Date
): Promise<void> => {
  await pool.execute(
    `INSERT INTO token_sessions (token_id, user_id, expires_at)
     VALUES (?, ?, ?)`,
    [tokenId, userId, expiresAt]
  );
};

export const isTokenRevoked = async (tokenId: string): Promise<boolean> => {
  const [rows] = await pool.query<Array<{ revoked_at: Date | string | null } & RowDataPacket>>(
    `SELECT revoked_at
     FROM token_sessions
     WHERE token_id = ?
     LIMIT 1`,
    [tokenId]
  );

  return !rows[0] || Boolean(rows[0].revoked_at);
};

export const revokeToken = async (tokenId: string): Promise<void> => {
  await pool.execute(
    `UPDATE token_sessions
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE token_id = ? AND revoked_at IS NULL`,
    [tokenId]
  );
};

export const revokeUserTokens = async (userId: number): Promise<void> => {
  await pool.execute(
    `UPDATE token_sessions
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND revoked_at IS NULL`,
    [userId]
  );
};

export const createPasswordResetToken = async (
  userId: number,
  tokenHash: string,
  expiresAt: Date
): Promise<void> => {
  await pool.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );
};

export const consumePasswordResetToken = async (
  tokenHash: string
): Promise<UserWithPassword | null> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<UserRow[]>(
      `SELECT u.id, u.name, u.email, u.password_hash, u.mfa_enabled, u.mfa_secret,
          u.failed_login_attempts, u.locked_until, u.created_at, u.updated_at
       FROM password_reset_tokens prt
       INNER JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = ?
         AND prt.consumed_at IS NULL
         AND prt.expires_at > CURRENT_TIMESTAMP
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    if (!rows[0]) {
      await connection.rollback();
      return null;
    }

    await connection.execute(
      `UPDATE password_reset_tokens
       SET consumed_at = CURRENT_TIMESTAMP
       WHERE token_hash = ?`,
      [tokenHash]
    );

    await connection.commit();

    return mapUserWithPassword(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const mysqlUserRepository: UserRepository = {
  createUser,
  findUserByEmail,
  findUserById,
  updatePassword,
  updateLoginProtection,
  updateMfaSecret,
  createTokenSession,
  isTokenRevoked,
  revokeToken,
  revokeUserTokens,
  createPasswordResetToken,
  consumePasswordResetToken
};
