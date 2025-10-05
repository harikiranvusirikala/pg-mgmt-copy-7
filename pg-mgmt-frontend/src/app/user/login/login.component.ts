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

  ngOnInit(): void {
    this.attemptAutoLogin();

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

  ngOnDestroy(): void {
    this.authStateSub?.unsubscribe();
  }

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
