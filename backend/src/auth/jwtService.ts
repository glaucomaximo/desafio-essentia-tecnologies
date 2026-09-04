import { HttpError } from "../errors/httpError";
import type { AuthenticatedUser, TokenPayload } from "../types/auth";

export interface JwtServiceOptions {
  secret: string;
  issuer: string;
  audience: string;
  expiresInSeconds: number;
}

export interface SignedToken {
  token: string;
  tokenId: string;
  expiresAt: string;
}

export interface JwtService {
  sign(user: AuthenticatedUser, tokenId: string): Promise<SignedToken>;
  verify(token: string): Promise<TokenPayload>;
}

export const createJwtService = (options: JwtServiceOptions): JwtService => {
  const secret = new TextEncoder().encode(options.secret);

  return {
    async sign(user, tokenId) {
      const { SignJWT } = await import("jose");
      const expiresAt = new Date(Date.now() + options.expiresInSeconds * 1000);
      const token = await new SignJWT({
        email: user.email,
        name: user.name
      })
        .setProtectedHeader({ alg: "HS256" })
        .setJti(tokenId)
        .setSubject(String(user.id))
        .setIssuer(options.issuer)
        .setAudience(options.audience)
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(secret);

      return {
        token,
        tokenId,
        expiresAt: expiresAt.toISOString()
      };
    },

    async verify(token) {
      const { jwtVerify } = await import("jose");

      try {
        const { payload } = await jwtVerify(token, secret, {
          issuer: options.issuer,
          audience: options.audience
        });

        const userId = typeof payload.sub === "string" ? Number(payload.sub) : Number.NaN;

        if (
          !Number.isInteger(userId) ||
          typeof payload.jti !== "string" ||
          typeof payload.email !== "string" ||
          typeof payload.name !== "string"
        ) {
          throw new HttpError(401, "Token invalido ou expirado.");
        }

        return {
          userId,
          email: payload.email,
          name: payload.name,
          tokenId: payload.jti
        };
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }

        throw new HttpError(401, "Token invalido ou expirado.");
      }
    }
  };
};
