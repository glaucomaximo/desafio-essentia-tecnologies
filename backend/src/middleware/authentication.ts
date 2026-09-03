import type { RequestHandler } from "express";
import { createJwtService, type JwtService } from "../auth/jwtService";
import { env } from "../config/env";
import { HttpError } from "../errors/httpError";
import { mysqlUserRepository, type UserRepository } from "../repositories/userRepository";
import type { AuthenticatedUser } from "../types/auth";

export interface AuthenticationOptions {
  jwtService?: JwtService;
  userRepository?: UserRepository;
}

const tokenFromHeader = (authorizationHeader: string | undefined): string => {
  if (!authorizationHeader) {
    throw new HttpError(401, "Token de autenticacao ausente.");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "Cabecalho de autenticacao invalido.");
  }

  return token;
};

export const currentUserFromResponse = (locals: Record<string, unknown>): AuthenticatedUser => {
  const user = locals.authenticatedUser;

  if (
    !user ||
    typeof user !== "object" ||
    typeof (user as AuthenticatedUser).id !== "number" ||
    typeof (user as AuthenticatedUser).email !== "string" ||
    typeof (user as AuthenticatedUser).name !== "string"
  ) {
    throw new HttpError(401, "Usuario autenticado nao identificado.");
  }

  return user as AuthenticatedUser;
};

export const createAuthenticationMiddleware = (
  options: AuthenticationOptions = {}
): RequestHandler => {
  const jwtService = options.jwtService ?? createJwtService(env.auth);
  const userRepository = options.userRepository ?? mysqlUserRepository;

  return async (request, response, next) => {
    try {
      const token = tokenFromHeader(request.header("Authorization"));
      const payload = await jwtService.verify(token);
      const user = await userRepository.findUserById(payload.userId);

      if (!user) {
        throw new HttpError(401, "Usuario autenticado nao encontrado.");
      }

      response.locals.authenticatedUser = user;
      next();
    } catch (error) {
      response.setHeader("WWW-Authenticate", "Bearer");
      next(error);
    }
  };
};

export const authenticationMiddleware = createAuthenticationMiddleware();
