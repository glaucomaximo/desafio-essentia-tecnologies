export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
