import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminAuthGuard } from '../core/guards/admin-auth.guard';
import { AdminLoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { SetupComponent } from './setup/setup.component';
import { RoomsComponent } from './rooms/rooms.component';
import { TenantsComponent } from './tenants/tenants.component';
import { ReportComponent } from './report/report.component';

/**
 * Route map for the admin portal, protecting protected pages with the admin guard.
 */
const routes: Routes = [
  { path: 'login', component: AdminLoginComponent },
  {
    path: '',
    canActivate: [AdminAuthGuard],
    canActivateChild: [AdminAuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'setup', component: SetupComponent },
      { path: 'rooms', component: RoomsComponent },
      { path: 'tenants', component: TenantsComponent },
      { path: 'report', component: ReportComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
/** Configures child routing for the admin feature area. */
export class AdminRoutingModule {}
