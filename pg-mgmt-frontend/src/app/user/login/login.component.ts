import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  SocialAuthService,
  GoogleLoginProvider,
  SocialUser,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ApiConfig } from '../../core/config/api.config';
import { Subscription } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, GoogleSigninButtonModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
/** Handles Google authentication flow for tenant access. */
export class LoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  private authStateSub?: Subscription;

  constructor(
    private readonly socialAuthService: SocialAuthService,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  /**
   * Subscribes to the Google auth stream and automatically signs a user in when the component loads.
   *
   * The handler performs two actions:
   * - Attempts to restore a previously persisted session before rendering the login button.
   * - Listens to Google sign-in events and forwards verified users to the backend for JWT issuance.
   */
  ngOnInit(): void {
    this.attemptAutoLogin();

    // Explicitly initialize Google provider when component loads
    this.socialAuthService
      .initState
      .subscribe(() => {
        // Google SDK is now ready
      })
      .add(() => {
        // Clean up
      });

    this.authStateSub = this.socialAuthService.authState.subscribe(
      (user: SocialUser | null) => {
        if (!user || user.provider !== GoogleLoginProvider.PROVIDER_ID) {
          return;
        }

        if (this.isLoading) {
          return;
        }

        this.handleGoogleUser(user);
      },
    );
  }

  /**
   * Cleans up the Google auth subscription to prevent memory leaks when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.authStateSub?.unsubscribe();
  }

  /**
   * Exchanges the Google id token for a backend-issued JWT and stores the tenant session locally.
   *
   * @param user - The Google social user returned by the angularx-social-login library.
   */
  private handleGoogleUser(user: SocialUser): void {
    if (!user.idToken) {
      console.error('🚫 Google sign-in failed: Missing ID token.');
      alert('Google sign-in failed. Please try again.');
      return;
    }

    this.isLoading = true;

    this.http
      .post<{ token: string; tenant: any }>(ApiConfig.authTenant, {
        idToken: user.idToken,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Login success:', response);

          if (response.token && response.tenant) {
            localStorage.setItem('authToken', response.token);
            const normalizedTenant = this.authService.setCurrentUser(
              response.tenant,
            );
            localStorage.setItem('user', JSON.stringify(normalizedTenant));
          }

          this.router.navigate(['/user/profile']).finally(() => {
            this.isLoading = false;
          });
        },
        error: (err) => {
          console.error('🚨 Login failed:', err);
          alert('Login failed. Please try again.');
          this.socialAuthService.signOut(true);
          this.isLoading = false;
        },
      });
  }

  /**
   * Attempts to restore a previously authenticated session using the stored JWT and user payload.
   *
   * If the persisted JWT is invalid or expired the session is cleared, forcing a fresh login.
   */
  private attemptAutoLogin(): void {
    const token = this.authService.getToken();
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      return;
    }

    if (!this.isJwtValid(token)) {
      this.authService.logout();
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      this.isLoading = true;
      const normalizedTenant = this.authService.setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(normalizedTenant));
      this.router.navigate(['/user/profile']).finally(() => {
        this.isLoading = false;
      });
    } catch (error) {
      console.error('🧾 Failed to parse stored user data:', error);
      this.authService.logout();
    }
  }

  /**
   * Validates an encoded JWT by ensuring its expiration has not passed.
   *
   * @param token - The encoded JWT returned by the backend.
   * @returns True when the token contains a finite future expiration timestamp; otherwise false.
   */
  private isJwtValid(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    const exp = payload?.['exp'];
    if (!exp) {
      return false;
    }

    const expNumber = Number(exp);
    if (!Number.isFinite(expNumber)) {
      return false;
    }

    const expiry = expNumber * 1000; // exp is in seconds
    return Date.now() < expiry;
  }

  /**
   * Decodes the payload segment of a JWT and returns it as a JSON object.
   *
   * @param token - The encoded JWT string.
   * @returns The decoded claims object when parsing succeeds, or null when decoding fails.
   */
  private decodeJwtPayload(token: string): Record<string, any> | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('🧮 Error decoding JWT payload:', error);
      return null;
    }
  }
}
