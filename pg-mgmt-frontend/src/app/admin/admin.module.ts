import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material.module';
import { AdminRoutingModule } from './admin-routing.module';
import { HomeComponent } from './home/home.component';
import { SetupComponent } from './setup/setup.component';
import { RoomsComponent } from './rooms/rooms.component';
import { TenantsComponent } from './tenants/tenants.component';
import { ReportComponent } from './report/report.component';
import { NgChartsModule } from 'ng2-charts';
import { AdminLoginComponent } from './login/login.component';

/**
 * Declares admin-facing screens and wires shared dependencies.
 */
@NgModule({
  declarations: [
    HomeComponent,
    SetupComponent,
    RoomsComponent,
    TenantsComponent,
    ReportComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgChartsModule,
    AdminRoutingModule,
    AdminLoginComponent,
  ],
})
export class AdminModule {}
