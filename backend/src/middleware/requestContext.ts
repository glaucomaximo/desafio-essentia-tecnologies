import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { logger } from "../shared/logger";

const requestIdHeader = "X-Request-ID";

const requestIdFromHeader = (request: Request): string | null => {
  const value = request.header(requestIdHeader);

  if (!value || value.length > 128) {
    return null;
  }

  return value;
};

export const requestContext: RequestHandler = (request, response, next) => {
  const requestId = requestIdFromHeader(request) ?? randomUUID();

  response.locals.requestId = requestId;
  response.setHeader(requestIdHeader, requestId);
  next();
};

export const requestLogger: RequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const startedAt = process.hrtime.bigint();

  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info("http_request_completed", {
      requestId: response.locals.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      remoteAddress: request.ip
    });
  });

  next();
};
