import { ApplicationConfig } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { authTokenInterceptor } from "./core/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withInterceptors([authTokenInterceptor]))]
};
