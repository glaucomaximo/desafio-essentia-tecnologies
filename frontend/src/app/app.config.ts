import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ApplicationConfig, provideZonelessChangeDetection } from "@angular/core";
import { authTokenInterceptor } from "./core/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless: a renderizacao passa a ser dirigida por Signals, sem zonas.
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([authTokenInterceptor]))
  ]
};
