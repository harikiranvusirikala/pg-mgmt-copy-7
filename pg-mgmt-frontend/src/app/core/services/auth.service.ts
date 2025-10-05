import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Tenant {
  id?: string;
  name: string;
  email: string;
  pictureUrl?: string;
  phone?: string;
  mealPreference?: string;
  roomNo?: string;
  due?: boolean;
  isActive?: boolean;
  renewalDate?: Date;
  continuousStay?: boolean;
}

type TenantLike = Tenant & { active?: boolean };

@Injectable({
  providedIn: 'root',
})
/** Maintains the tenant authentication state shared throughout the app. */
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<Tenant | null>(
    null,
  );
  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {
    // Check if user is already logged in on service initialization
    this.checkAuthState();
  }

  private checkAuthState(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as TenantLike;
        const normalized = this.setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        this.logout();
      }
    }
  }

  public setCurrentUser(user: TenantLike): Tenant {
    const normalizedTenant = this.normalizeTenant(user);
    if (!normalizedTenant) {
      throw new Error('Unable to normalize tenant data.');
    }
    this.currentUserSubject.next(normalizedTenant);
    this.isLoggedInSubject.next(true);
    return normalizedTenant;
  }

  public getCurrentUser(): Tenant | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  public getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  public logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  public normalizeTenant(user: TenantLike | null): Tenant | null {
    if (!user) {
      return null;
    }

    const { active, ...rest } = user;

    return {
      ...rest,
      isActive: rest.isActive ?? active ?? false,
    };
  }
}
