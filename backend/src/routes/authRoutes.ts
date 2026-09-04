import { Router, type RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { currentTokenFromResponse, currentUserFromResponse } from "../middleware/authentication";
import { authService, type AuthService } from "../services/authService";
import {
  parseEnableMfaPayload,
  parseLoginPayload,
  parsePasswordResetPayload,
  parsePasswordResetRequestPayload,
  parseRegisterUserPayload
} from "../schemas/authPayload";

export const createAuthRouter = (
  authenticate: RequestHandler,
  service: AuthService = authService
): Router => {
  const authRouter = Router();

  authRouter.post(
    "/register",
    asyncHandler(async (request, response) => {
      response.status(201).json(await service.register(parseRegisterUserPayload(request.body)));
    })
  );

  authRouter.post(
    "/login",
    asyncHandler(async (request, response) => {
      response.json(await service.login(parseLoginPayload(request.body)));
    })
  );

  authRouter.post(
    "/password-reset/request",
    asyncHandler(async (request, response) => {
      response
        .status(202)
        .json(await service.requestPasswordReset(parsePasswordResetRequestPayload(request.body)));
    })
  );

  authRouter.post(
    "/password-reset/confirm",
    asyncHandler(async (request, response) => {
      await service.resetPassword(parsePasswordResetPayload(request.body));
      response.status(204).send();
    })
  );

  authRouter.post(
    "/mfa/setup",
    authenticate,
    asyncHandler(async (_request, response) => {
      response
        .status(201)
        .json(await service.beginMfaSetup(currentUserFromResponse(response.locals)));
    })
  );

  authRouter.post(
    "/mfa/enable",
    authenticate,
    asyncHandler(async (request, response) => {
      await service.enableMfa(
        currentUserFromResponse(response.locals),
        parseEnableMfaPayload(request.body)
      );
      response.status(204).send();
    })
  );

  authRouter.post(
    "/logout",
    authenticate,
    asyncHandler(async (_request, response) => {
      await service.logout(currentTokenFromResponse(response.locals).tokenId);
      response.status(204).send();
    })
  );

  authRouter.post(
    "/logout-all",
    authenticate,
    asyncHandler(async (_request, response) => {
      await service.logoutAll(currentUserFromResponse(response.locals).id);
      response.status(204).send();
    })
  );

  authRouter.get(
    "/me",
    authenticate,
    asyncHandler(async (_request, response) => {
      response.json({
        user: currentUserFromResponse(response.locals)
      });
    })
  );

  return authRouter;
};
