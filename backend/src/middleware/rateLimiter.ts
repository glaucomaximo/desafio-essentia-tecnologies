import type { RequestHandler } from "express";

export interface RateLimitOptions {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
}

interface ClientWindow {
  count: number;
  resetAt: number;
}

const clientKey = (request: Parameters<RequestHandler>[0]): string =>
  request.ip || request.socket.remoteAddress || "unknown";

export const createRateLimiter = (options: RateLimitOptions): RequestHandler => {
  const clients = new Map<string, ClientWindow>();

  return (request, response, next) => {
    if (!options.enabled) {
      next();
      return;
    }

    const now = Date.now();
    const key = clientKey(request);
    const current = clients.get(key);
    const window =
      current && current.resetAt > now
        ? current
        : {
            count: 0,
            resetAt: now + options.windowMs
          };

    window.count += 1;
    clients.set(key, window);

    response.setHeader("RateLimit-Limit", String(options.maxRequests));
    response.setHeader(
      "RateLimit-Remaining",
      String(Math.max(options.maxRequests - window.count, 0))
    );
    response.setHeader("RateLimit-Reset", String(Math.ceil(window.resetAt / 1000)));

    if (window.count > options.maxRequests) {
      response.status(429).json({
        message: "Muitas requisicoes. Tente novamente mais tarde.",
        requestId: response.locals.requestId
      });
      return;
    }

    if (clients.size > 10_000) {
      for (const [storedKey, storedWindow] of clients.entries()) {
        if (storedWindow.resetAt <= now) {
          clients.delete(storedKey);
        }
      }
    }

    next();
  };
};
