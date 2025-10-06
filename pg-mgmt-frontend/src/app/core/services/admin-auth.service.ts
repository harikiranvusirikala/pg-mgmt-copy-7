import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Minimal profile information about an authenticated administrator.
 */
export interface AdminUser {
  id?: string;
  name: string;
  email: string;
  pictureUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Maintains administrator authentication state for the admin portal.
 */
export class AdminAuthService {
  private readonly currentAdminSubject = new BehaviorSubject<AdminUser | null>(
    null,
  );
  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false);

  readonly currentAdmin$ = this.currentAdminSubject.asObservable();
  readonly isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {
    this.restoreFromStorage();
  }

  /**
   * Attempts to restore a persisted admin session from local storage.
   */
  private restoreFromStorage(): void {
    const token = this.getToken();
    const adminStr = localStorage.getItem('adminUser');

    if (!token || !adminStr) {
      return;
    }

    try {
      const stored = JSON.parse(adminStr) as AdminUser;
      const normalized = this.setCurrentAdmin(stored);
      localStorage.setItem('adminUser', JSON.stringify(normalized));
    } catch (error) {
      console.error('❌ Failed to restore admin session:', error);
      this.logout();
    }
  }

  /**
   * Registers the supplied admin as logged in and emits the new session state.
   */
  setCurrentAdmin(admin: AdminUser): AdminUser {
    const normalized = this.normalizeAdmin(admin);
    if (!normalized) {
      throw new Error('Unable to normalize admin data.');
    }

    this.currentAdminSubject.next(normalized);
    this.isLoggedInSubject.next(true);
    return normalized;
  }

  /**
   * Retrieves the currently logged in admin if one exists.
   */
  getCurrentAdmin(): AdminUser | null {
    return this.currentAdminSubject.value;
  }

  /**
   * Indicates whether an admin session is active.
   */
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  /**
   * Returns the stored admin JWT token.
   */
  getToken(): string | null {
    return localStorage.getItem('adminAuthToken');
  }

  /**
   * Clears admin session data from memory and storage.
   */
  logout(): void {
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminUser');
    this.currentAdminSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  /**
   * Produces a sanitized admin profile with fallbacks for missing display name.
   */
  private normalizeAdmin(admin: AdminUser | null): AdminUser | null {
    if (!admin) {
      return null;
    }

    const name = admin.name?.trim();

    return {
      ...admin,
      name: name && name.length > 0 ? name : admin.email,
    };
  }
}
