import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../errors/httpError";
import { env } from "../config/env";
import { logger } from "../shared/logger";

interface ClientErrorLike {
  status?: unknown;
  statusCode?: unknown;
}

const responseBody = (
  message: string,
  requestId: unknown,
  details?: unknown
): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    message,
    requestId
  };

  if (details !== undefined) {
    body.details = details;
  }

  return body;
};

const clientErrorStatus = (error: unknown): number | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as ClientErrorLike;
  const status = typeof candidate.status === "number" ? candidate.status : candidate.statusCode;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return status;
  }

  return null;
};

export const notFoundHandler: RequestHandler = (request, response) => {
  logger.warn("route_not_found", {
    requestId: response.locals.requestId,
    method: request.method,
    path: request.originalUrl
  });

  response.status(404).json(responseBody("Rota nao encontrada.", response.locals.requestId));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    logger.warn("http_error", {
      requestId: response.locals.requestId,
      statusCode: error.statusCode,
      message: error.message
    });

    response
      .status(error.statusCode)
      .json(responseBody(error.message, response.locals.requestId, error.details));
    return;
  }

  const status = clientErrorStatus(error);

  if (status) {
    logger.warn("client_request_error", {
      requestId: response.locals.requestId,
      statusCode: status
    });

    response
      .status(status)
      .json(
        responseBody(
          status === 413 ? "Corpo da requisicao muito grande." : "Requisicao invalida.",
          response.locals.requestId
        )
      );
    return;
  }

  logger.error("unhandled_error", {
    requestId: response.locals.requestId,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: env.nodeEnv === "production" ? undefined : error.stack
          }
        : error
  });

  response.status(500).json(responseBody("Erro interno do servidor.", response.locals.requestId));
};
