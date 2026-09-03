import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import type { AuthSession, AuthenticatedUser, LoginPayload, RegisterPayload } from "./auth.model";

@Injectable({
  providedIn: "root"
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = "/api/v1/auth";

  register(payload: RegisterPayload): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.baseUrl}/register`, payload);
  }

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.baseUrl}/login`, payload);
  }

  me(): Observable<{ user: AuthenticatedUser }> {
    return this.http.get<{ user: AuthenticatedUser }>(`${this.baseUrl}/me`);
  }
}
