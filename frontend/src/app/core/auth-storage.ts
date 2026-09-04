import { isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import type { AuthSession } from "./auth.model";

const storageKey = "techx.tasks.auth";

@Injectable({
  providedIn: "root"
})
export class AuthStorage {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  loadSession(): AuthSession | null {
    if (!this.isBrowser) {
      return null;
    }

    const rawSession = globalThis.localStorage.getItem(storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      const session = JSON.parse(rawSession) as AuthSession;

      if (!session.token || !session.user || new Date(session.expiresAt).getTime() <= Date.now()) {
        this.clearSession();
        return null;
      }

      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  saveSession(session: AuthSession): void {
    if (!this.isBrowser) {
      return;
    }

    globalThis.localStorage.setItem(storageKey, JSON.stringify(session));
  }

  clearSession(): void {
    if (!this.isBrowser) {
      return;
    }

    globalThis.localStorage.removeItem(storageKey);
  }

  token(): string | null {
    return this.loadSession()?.token ?? null;
  }
}
