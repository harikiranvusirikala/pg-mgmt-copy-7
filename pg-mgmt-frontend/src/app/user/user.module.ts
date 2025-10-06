import { NgModule } from '@angular/core';

import { UserRoutingModule } from './user-routing.module';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';

/**
 * Bundles tenant-facing login and profile experiences.
 */
@NgModule({
  imports: [UserRoutingModule, LoginComponent, ProfileComponent],
})
export class UserModule {}
