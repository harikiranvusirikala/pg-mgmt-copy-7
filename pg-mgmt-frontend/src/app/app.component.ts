/* eslint-disable @angular-eslint/prefer-standalone */
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SocialAuthService } from '@abacritt/angularx-social-login';

import { AuthService } from './core/services/auth.service';
import { AdminAuthService } from './core/services/admin-auth.service';

/**
 * Hosts the root shell, handles theme toggling, and exposes auth state streams.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  protected title = 'PG Manager';
  private readonly themeStorageKey = 'pg-mgmt-theme';
  protected currentTheme: 'light' | 'dark' = 'light';
  protected themeIcon = 'dark_mode';
  protected themeTooltip = 'Switch to dark mode 🌙';
  private mediaQuery?: MediaQueryList;
  private readonly mediaQueryListener = (event: MediaQueryListEvent) => {
    if (this.hasStoredPreference()) {
      return;
    }
    const nextTheme = event.matches ? 'dark' : 'light';
    this.applyTheme(nextTheme, false);
  };

  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly socialAuthService: SocialAuthService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  public ngOnInit(): void {
    this.initializeTheme();
    this.startMediaQueryListener();
  }

  public ngOnDestroy(): void {
    this.stopMediaQueryListener();
  }

  /**
   * Observable emitting the currently authenticated admin, if any.
   */
  protected get admin$() {
    return this.adminAuthService.currentAdmin$;
  }

  /**
   * Observable emitting the currently authenticated tenant, if any.
   */
  protected get tenant$() {
    return this.authService.currentUser$;
  }

  /**
   * Emits authentication state changes for administrators.
   */
  protected get adminLoggedIn$() {
    return this.adminAuthService.isLoggedIn$;
  }

  /**
   * Emits authentication state changes for tenants.
   */
  protected get userLoggedIn$() {
    return this.authService.isLoggedIn$;
  }

  /**
   * Toggles between light and dark themes, aiming for a cozy experience regardless of ambient lighting.
   */
  protected toggleTheme(): void {
    const nextTheme: 'light' | 'dark' =
      this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(nextTheme, true);
  }

  protected logoutAdmin(): void {
    this.adminAuthService.logout();
    void this.socialAuthService.signOut(true);
    void this.router.navigate(['/']);
  }

  /**
   * Logs out the tenant user session and routes to the landing page.
   */
  protected logoutUser(): void {
    this.authService.logout();
    void this.socialAuthService.signOut(true);
    void this.router.navigate(['/']);
  }

  private initializeTheme(): void {
    const storedTheme = this.getStoredTheme();
    if (storedTheme) {
      this.applyTheme(storedTheme, false);
      return;
    }

    const prefersDark = this.prefersDarkMode();
    const initialTheme: 'light' | 'dark' = prefersDark ? 'dark' : 'light';
    this.applyTheme(initialTheme, false);
  }

  private applyTheme(theme: 'light' | 'dark', persist: boolean): void {
    this.currentTheme = theme;
    this.document.documentElement.setAttribute('data-theme', theme);
    this.themeIcon = theme === 'dark' ? 'light_mode' : 'dark_mode';
    this.themeTooltip =
      theme === 'dark' ? 'Switch to light mode ☀️' : 'Switch to dark mode 🌙';

    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.themeStorageKey, theme);
    } else if (!persist && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.themeStorageKey);
    }
  }

  private getStoredTheme(): 'light' | 'dark' | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const value = localStorage.getItem(this.themeStorageKey);
    return value === 'light' || value === 'dark' ? value : null;
  }

  private hasStoredPreference(): boolean {
    return this.getStoredTheme() !== null;
  }

  private prefersDarkMode(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private startMediaQueryListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.mediaQueryListener);
  }

  private stopMediaQueryListener(): void {
    if (!this.mediaQuery) {
      return;
    }
    this.mediaQuery.removeEventListener('change', this.mediaQueryListener);
  }
}
