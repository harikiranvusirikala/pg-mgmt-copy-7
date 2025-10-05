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
/** Locks down admin-only routes unless an admin session is active. */
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureAdmin(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureAdmin(state.url);
  }

  private ensureAdmin(redirectUrl: string): boolean | UrlTree {
    if (this.adminAuthService.isLoggedIn()) {
      return true;
    }

    return this.router.createUrlTree(['/admin/login'], {
      queryParams: { returnUrl: redirectUrl },
    });
  }
}
