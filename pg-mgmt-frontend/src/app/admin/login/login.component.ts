import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  SocialAuthService,
  SocialUser,
} from '@abacritt/angularx-social-login';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

import {
  AdminAuthService,
  AdminUser,
} from '../../core/services/admin-auth.service';
import { ApiConfig } from '../../core/config/api.config';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, GoogleSigninButtonModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
/** Handles Google-based sign-in flow for administrators. */
export class AdminLoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  private authStateSub?: Subscription;

  constructor(
    private readonly socialAuthService: SocialAuthService,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly adminAuthService: AdminAuthService,
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
      .post<{
        token: string;
        admin: AdminUser;
      }>(ApiConfig.authAdmin, { idToken: user.idToken })
      .subscribe({
        next: (response) => {
          if (response.token && response.admin) {
            localStorage.setItem('adminAuthToken', response.token);
            const normalizedAdmin = this.adminAuthService.setCurrentAdmin(
              response.admin,
            );
            localStorage.setItem('adminUser', JSON.stringify(normalizedAdmin));
          }

          this.router.navigate(['/admin/home']).finally(() => {
            this.isLoading = false;
          });
        },
        error: (err) => {
          console.error('🚨 Admin login failed:', err);
          alert('Admin login failed. Please try again.');
          this.socialAuthService.signOut(true);
          this.isLoading = false;
        },
      });
  }

  private attemptAutoLogin(): void {
    const token = this.adminAuthService.getToken();
    const storedAdmin = localStorage.getItem('adminUser');

    if (!token || !storedAdmin) {
      return;
    }

    if (!this.isJwtValid(token)) {
      this.adminAuthService.logout();
      return;
    }

    try {
      const admin = JSON.parse(storedAdmin) as AdminUser;
      this.isLoading = true;
      const normalizedAdmin = this.adminAuthService.setCurrentAdmin(admin);
      localStorage.setItem('adminUser', JSON.stringify(normalizedAdmin));
      this.router.navigate(['/admin/home']).finally(() => {
        this.isLoading = false;
      });
    } catch (error) {
      console.error('🧾 Failed to parse stored admin data:', error);
      this.adminAuthService.logout();
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

    const expiry = expNumber * 1000;
    return Date.now() < expiry;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
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
      return JSON.parse(jsonPayload) as Record<string, unknown>;
    } catch (error) {
      console.error('🧮 Error decoding JWT payload:', error);
      return null;
    }
  }
}
