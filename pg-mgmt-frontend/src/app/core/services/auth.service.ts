import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Shape of a tenant profile as exposed to the Angular UI.
 */
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

/**
 * Normalized tenant payload used while reading from storage.
 */
type TenantLike = Tenant & { active?: boolean };

@Injectable({
  providedIn: 'root',
})
/**
 * Manages the authenticated tenant session and exposes reactive state for the UI.
 */
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

  /**
   * Restores session state from local storage when the application boots.
   */
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

  /**
   * Persists the supplied tenant as the active user and broadcasts session state.
   */
  public setCurrentUser(user: TenantLike): Tenant {
    const normalizedTenant = this.normalizeTenant(user);
    if (!normalizedTenant) {
      throw new Error('Unable to normalize tenant data.');
    }
    this.currentUserSubject.next(normalizedTenant);
    this.isLoggedInSubject.next(true);
    return normalizedTenant;
  }

  /**
   * Returns the current tenant synchronously if one is set.
   */
  public getCurrentUser(): Tenant | null {
    return this.currentUserSubject.value;
  }

  /**
   * Indicates whether a tenant session is currently active.
   */
  public isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  /**
   * Retrieves the persisted authentication token.
   */
  public getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Clears all tenant session information and broadcasts the logout event.
   */
  public logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  /**
   * Ensures tenant data contains the properties expected by the UI layer.
   */
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
