import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthStorage } from "./auth-storage";

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStorage).token();

  if (!token || !request.url.startsWith("/api")) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
