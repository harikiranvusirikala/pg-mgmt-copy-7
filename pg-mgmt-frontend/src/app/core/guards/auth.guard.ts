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
/** Protects tenant routes by ensuring the user is authenticated. */
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureTenant(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    return this.ensureTenant(state.url);
  }

  private ensureTenant(redirectUrl: string): boolean | UrlTree {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    return this.router.createUrlTree(['/user/login'], {
      queryParams: { returnUrl: redirectUrl },
    });
  }
}
