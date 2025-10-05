import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdminUser {
  id?: string;
  name: string;
  email: string;
  pictureUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
/** Handles admin authentication state and persistence. */
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

  setCurrentAdmin(admin: AdminUser): AdminUser {
    const normalized = this.normalizeAdmin(admin);
    if (!normalized) {
      throw new Error('Unable to normalize admin data.');
    }

    this.currentAdminSubject.next(normalized);
    this.isLoggedInSubject.next(true);
    return normalized;
  }

  getCurrentAdmin(): AdminUser | null {
    return this.currentAdminSubject.value;
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('adminAuthToken');
  }

  logout(): void {
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminUser');
    this.currentAdminSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

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
