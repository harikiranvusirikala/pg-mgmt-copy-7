import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { AuthService, Tenant } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
/** Lets tenants review and update profile details with real-time validation. */
export class ProfileComponent implements OnInit, OnDestroy {
  user: Tenant | null = null;
  isProfileLoading = false;
  isStatusUpdating = false;
  isMealUpdating = false;
  isPhoneSaving = false;
  isContinuousStayUpdating = false;

  readonly mealOptions: Array<Tenant['mealPreference']> = ['Veg', 'Non-Veg'];
  // Phone must be exactly 10 digits (Indian phone format without country code)
  readonly phoneControl = new FormControl<string>('', [
    Validators.pattern(/^\d{10}$/),
    Validators.maxLength(10),
    Validators.minLength(10),
  ]);
  readonly mealPreferenceControl = new FormControl<
    Tenant['mealPreference'] | null
  >(null);

  private readonly subscriptions = new Subscription();
  private hasFetchedProfile = false;

  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (this.user) {
      this.syncFormControls(this.user);
    }

    if (this.user?.email) {
      this.fetchLatestProfile(this.user.email);
      this.hasFetchedProfile = true;
    }

    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user) => {
        this.user = user;
        if (user) {
          this.syncFormControls(user);
        }
        if (!this.hasFetchedProfile && user?.email) {
          this.fetchLatestProfile(user.email);
          this.hasFetchedProfile = true;
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get accountStatusLabel(): string {
    return this.user?.isActive ? 'Active' : 'Inactive';
  }

  get canSavePhone(): boolean {
    if (
      !this.user?.id ||
      this.phoneControl.invalid ||
      this.isPhoneSaving ||
      this.isProfileLoading ||
      this.isContinuousStayUpdating
    ) {
      return false;
    }
    const currentPhone = this.user.phone ?? '';
    const controlValue = (this.phoneControl.value ?? '').trim();
    // Only enable when input is a valid 10-digit number and different from current
    return controlValue !== currentPhone && this.phoneControl.valid;
  }

  refreshProfile(): void {
    if (!this.user?.email) {
      this.snackBar.open(
        'ℹ️ No profile email available to refresh.',
        'Dismiss',
        {
          duration: 4000,
        },
      );
      return;
    }

    this.fetchLatestProfile(this.user.email, true);
  }

  onActiveToggle(event: MatSlideToggleChange): void {
    if (!this.user?.id) {
      event.source.checked = !!this.user?.isActive;
      this.snackBar.open('⚠️ Tenant information is incomplete.', 'Dismiss', {
        duration: 4000,
      });
      return;
    }

    const newStatus = event.checked;

    if (this.isStatusUpdating) {
      event.source.checked = !!this.user?.isActive;
      return;
    }

    this.isStatusUpdating = true;

    this.tenantService.updateTenantStatus(this.user.id, newStatus).subscribe({
      next: (updatedTenant) => {
        const mergedUser: Tenant = { ...this.user!, ...updatedTenant };
        const normalizedUser = this.authService.setCurrentUser(mergedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        this.user = normalizedUser;
        this.isStatusUpdating = false;
        this.snackBar.open(
          `✅ Meal status ${newStatus ? 'activated' : 'deactivated'}.`,
          'Dismiss',
          { duration: 3500 },
        );
      },
      error: (error) => {
        console.error('🚦 Failed to update tenant status:', error);
        this.isStatusUpdating = false;
        event.source.checked = !newStatus;
        this.snackBar.open(
          '❌ Unable to update status. Please try again.',
          'Dismiss',
          {
            duration: 4000,
          },
        );
      },
    });
  }

  onMealPreferenceChange(event: MatSelectChange): void {
    if (
      !this.user?.id ||
      this.isMealUpdating ||
      this.isProfileLoading ||
      this.isContinuousStayUpdating
    ) {
      return;
    }

    const selectedValue = event.value as Tenant['mealPreference'] | null;
    const currentValue = this.user.mealPreference ?? null;

    if (selectedValue === currentValue) {
      return;
    }

    this.isMealUpdating = true;
    const payload = { mealPreference: selectedValue ?? undefined };

    this.tenantService.updateTenantProfile(this.user.id, payload).subscribe({
      next: (updatedTenant) => {
        this.handleProfileUpdate(updatedTenant, '🍽️ Meal preference updated.');
        this.isMealUpdating = false;
      },
      error: (error) => {
        console.error('🍽️ Failed to update meal preference:', error);
        this.isMealUpdating = false;
        this.mealPreferenceControl.setValue(currentValue, { emitEvent: false });
        this.snackBar.open(
          '🍽️ Unable to update meal preference. Please try again.',
          'Dismiss',
          {
            duration: 4000,
          },
        );
      },
    });
  }

  onContinuousStayToggle(event: MatSlideToggleChange): void {
    if (!this.user?.id) {
      event.source.checked = !!this.user?.continuousStay;
      this.snackBar.open('⚠️ Tenant information is incomplete.', 'Dismiss', {
        duration: 4000,
      });
      return;
    }

    if (this.isContinuousStayUpdating) {
      event.source.checked = !!this.user?.continuousStay;
      return;
    }

    const newValue = event.checked;
    this.isContinuousStayUpdating = true;

    this.tenantService
      .updateTenantProfile(this.user.id, { continuousStay: newValue })
      .subscribe({
        next: (updatedTenant) => {
          this.handleProfileUpdate(
            updatedTenant,
            `🛏️ Continuous stay ${newValue ? 'enabled' : 'disabled'}.`,
          );
          this.isContinuousStayUpdating = false;
        },
        error: (error) => {
          console.error('🛏️ Failed to update continuous stay:', error);
          this.isContinuousStayUpdating = false;
          event.source.checked = !newValue;
          this.snackBar.open(
            '🛏️ Unable to update continuous stay. Please try again.',
            'Dismiss',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  savePhoneNumber(): void {
    if (!this.user?.id || !this.canSavePhone) {
      return;
    }

    const phoneValue = (this.phoneControl.value ?? '').trim();
    this.isPhoneSaving = true;

    this.tenantService
      .updateTenantProfile(this.user.id, { phone: phoneValue || undefined })
      .subscribe({
        next: (updatedTenant) => {
          this.handleProfileUpdate(updatedTenant, '☎️ Phone number updated.');
          this.isPhoneSaving = false;
        },
        error: (error) => {
          console.error('☎️ Failed to update phone number:', error);
          this.isPhoneSaving = false;
          this.phoneControl.setValue(this.user?.phone ?? '', {
            emitEvent: false,
          });
          this.snackBar.open(
            '☎️ Unable to update phone number. Please try again.',
            'Dismiss',
            {
              duration: 4000,
            },
          );
        },
      });
  }

  private fetchLatestProfile(email: string, showToast = false): void {
    this.isProfileLoading = true;
    this.tenantService.getTenantByEmail(email).subscribe({
      next: (tenant) => {
        if (tenant) {
          const normalizedTenant = this.authService.setCurrentUser(tenant);
          localStorage.setItem('user', JSON.stringify(normalizedTenant));
          this.user = normalizedTenant;
          this.syncFormControls(normalizedTenant);
          if (showToast) {
            this.snackBar.open('🔄 Profile refreshed.', 'Dismiss', {
              duration: 3000,
            });
          }
        }
        this.isProfileLoading = false;
      },
      error: (error) => {
        console.error('🌐 Failed to load profile from server:', error);
        this.isProfileLoading = false;
        if (showToast) {
          this.snackBar.open('❌ Unable to refresh profile.', 'Dismiss', {
            duration: 4000,
          });
        }
      },
    });
  }

  private handleProfileUpdate(updatedTenant: Tenant, message: string): void {
    const mergedTenant: Tenant = {
      ...(this.user ?? ({} as Tenant)),
      ...updatedTenant,
    };
    const normalizedTenant = this.authService.setCurrentUser(mergedTenant);
    localStorage.setItem('user', JSON.stringify(normalizedTenant));
    this.user = normalizedTenant;
    this.syncFormControls(normalizedTenant);
    this.snackBar.open(message, 'Dismiss', { duration: 3000 });
  }

  private syncFormControls(tenant: Tenant): void {
    this.phoneControl.setValue(tenant.phone ?? '', { emitEvent: false });
    this.mealPreferenceControl.setValue(tenant.mealPreference ?? null, {
      emitEvent: false,
    });
  }
}
