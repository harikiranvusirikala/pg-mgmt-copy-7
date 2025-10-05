import { Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
// eslint-disable-next-line deprecation/deprecation
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import {
  GoogleLoginProvider,
  SocialAuthService,
  SocialAuthServiceConfig,
  SocialLoginModule,
  SOCIAL_AUTH_CONFIG,
} from '@abacritt/angularx-social-login';
import { Observable } from 'rxjs';

import { ApiConfig } from './core/config/api.config';
import { AuthService } from './core/services/auth.service';
import { AdminAuthService } from './core/services/admin-auth.service';

import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (
      !this.isApiRequest(request.url) ||
      request.headers.has('Authorization')
    ) {
      return next.handle(request);
    }

    const token = this.resolveToken();
    if (!token) {
      return next.handle(request);
    }

    const authorizedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(authorizedRequest);
  }

  private resolveToken(): string | null {
    return this.adminAuthService.getToken() ?? this.authService.getToken();
  }

  private isApiRequest(url: string): boolean {
    if (!url) {
      return false;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return ApiConfig.base ? url.startsWith(ApiConfig.base) : false;
    }

    return true;
  }
}

/**
 * Bootstraps the Angular application with shared modules and feature screens.
 */
@NgModule({
  declarations: [AppComponent, LandingComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    SocialLoginModule,
    // eslint-disable-next-line deprecation/deprecation
    BrowserAnimationsModule,
  ],
  providers: [
    SocialAuthService,
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthTokenInterceptor,
      multi: true,
    },
    {
      provide: SOCIAL_AUTH_CONFIG,
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(environment.googleClientId),
          },
        ],
        onError: (err: unknown) => console.error('⚠️ Social login error:', err),
      } as SocialAuthServiceConfig,
    },
  ],
})
export class AppModule {}
