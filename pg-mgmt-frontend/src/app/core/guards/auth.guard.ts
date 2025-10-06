import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
/**
 * Protects tenant-only routes by ensuring an authenticated tenant exists.
 */
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  /**
   * Blocks navigation unless a tenant session is active.
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureTenant(state.url);
  }

  /**
   * Applies the same tenant check to child routes.
   */
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureTenant(state.url);
  }

  /**
   * Redirects unauthenticated tenants to the login view with a return URL.
   */
  private ensureTenant(redirectUrl: string): boolean | UrlTree {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    return this.router.createUrlTree(['/user/login'], {
      queryParams: { returnUrl: redirectUrl },
    });
  }
}
