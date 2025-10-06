import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { AdminAuthService } from '../services/admin-auth.service';

@Injectable({
  providedIn: 'root',
})
/**
 * Guards admin routes by validating the administrator session state.
 */
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router,
  ) {}

  /**
   * Prevents navigation to admin routes for unauthenticated users.
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureAdmin(state.url);
  }

  /**
   * Applies the same access check to nested admin routes.
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureAdmin(state.url);
  }

  /**
   * Redirects unauthorized admins to the login page and stores the target URL.
   */
  private ensureAdmin(redirectUrl: string): boolean | UrlTree {
    if (this.adminAuthService.isLoggedIn()) {
      return true;
    }

    return this.router.createUrlTree(['/admin/login'], {
      queryParams: { returnUrl: redirectUrl },
    });
  }
}
