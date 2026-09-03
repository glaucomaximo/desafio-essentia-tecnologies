import { Injectable } from "@angular/core";
import type { AuthSession } from "./auth.model";

const storageKey = "techx.tasks.auth";

@Injectable({
  providedIn: "root"
})
export class AuthStorage {
  loadSession(): AuthSession | null {
    const rawSession = window.localStorage.getItem(storageKey);

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
    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }

  clearSession(): void {
    window.localStorage.removeItem(storageKey);
  }

  token(): string | null {
    return this.loadSession()?.token ?? null;
  }
}
