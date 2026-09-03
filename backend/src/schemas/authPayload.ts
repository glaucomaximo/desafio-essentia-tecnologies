import { HttpError } from "../errors/httpError";
import type { LoginPayload, RegisterUserPayload } from "../types/auth";

type RequestBody = Record<string, unknown>;

const asRequestBody = (payload: unknown): RequestBody => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "O corpo da requisicao deve ser um objeto JSON.");
  }

  return payload as RequestBody;
};

const parseName = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new HttpError(400, "O nome do usuario e obrigatorio.");
  }

  const name = value.trim();

  if (name.length < 2) {
    throw new HttpError(400, "O nome do usuario deve ter pelo menos 2 caracteres.");
  }

  if (name.length > 120) {
    throw new HttpError(400, "O nome do usuario deve ter no maximo 120 caracteres.");
  }

  return name;
};

const parseEmail = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new HttpError(400, "O e-mail e obrigatorio.");
  }

  const email = value.trim().toLowerCase();

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Informe um e-mail valido.");
  }

  return email;
};

const parsePassword = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new HttpError(400, "A senha e obrigatoria.");
  }

  if (value.length < 8 || value.length > 128) {
    throw new HttpError(400, "A senha deve ter entre 8 e 128 caracteres.");
  }

  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw new HttpError(400, "A senha deve conter letras e numeros.");
  }

  return value;
};

export const parseRegisterUserPayload = (payload: unknown): RegisterUserPayload => {
  const body = asRequestBody(payload);

  return {
    name: parseName(body.name),
    email: parseEmail(body.email),
    password: parsePassword(body.password)
  };
};

export const parseLoginPayload = (payload: unknown): LoginPayload => {
  const body = asRequestBody(payload);

  return {
    email: parseEmail(body.email),
    password: parsePassword(body.password)
  };
};
