import { Router, type RequestHandler } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { currentUserFromResponse } from "../middleware/authentication";
import { authService, type AuthService } from "../services/authService";
import { parseLoginPayload, parseRegisterUserPayload } from "../schemas/authPayload";

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
