/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { TenantService } from '../../core/services/tenant.service';
import { Tenant } from '../../core/services/auth.service';
import { RoomService, Room } from '../../core/services/room.service';

@Component({
  selector: 'app-tenants',
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.css',
  standalone: false,
})
/**
 * Provides tenant management workflows including room assignments, renewals, and filtering.
 */
export class TenantsComponent implements OnInit, OnDestroy {
  tenants: Tenant[] = [];
  filteredTenants: Tenant[] = [];
  rooms: Room[] = [];
  isLoadingTenants = false;
  isLoadingRooms = false;
  minRenewalDate: Date = this.getStartOfToday();
  searchTerm = '';
  readonly columns: string[] = [
    'isActive',
    'name',
    // 'email',
    'phone',
    'mealPreference',
    'roomNo',
    'renewalDate',
    'continuousStay',
    'due',
  ];

  private readonly destroy$ = new Subject<void>();
  private readonly updatingTenantIds = new Set<string>();

  constructor(
    private readonly tenantService: TenantService,
    private readonly roomService: RoomService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadTenants();
    this.loadRooms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Supplies a stable identifier for rendered tenant rows.
   */
  trackByTenantId(_: number, tenant: Tenant): string | undefined {
    return tenant.id;
  }

  /**
   * Indicates whether a search filter is currently applied.
   */
  get hasSearchTerm(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  /**
   * Determines if the UI should show a loading indicator for a tenant action.
   */
  isTenantUpdating(tenantId?: string): boolean {
    if (!tenantId) {
      return false;
    }
    return this.updatingTenantIds.has(tenantId);
  }

  /**
   * Reassigns a tenant to a different room and refreshes supporting data.
   */
  onRoomChange(tenant: Tenant, newRoomNo: string | null): void {
    if (!tenant.id) {
      this.snackBar.open('⚠️ Tenant identifier is missing.', 'Dismiss', {
        duration: 4000,
      });
      return;
    }

    const tenantId = tenant.id;

    const normalizedCurrent = this.normalizeRoom(tenant.roomNo);
    const normalizedNext = this.normalizeRoom(newRoomNo);

    if (normalizedCurrent === normalizedNext) {
      return;
    }

    this.updatingTenantIds.add(tenantId);

    this.tenantService
      .updateTenantRoom(tenantId, normalizedNext)
      .pipe(finalize(() => this.updatingTenantIds.delete(tenantId)))
      .subscribe({
        next: (updatedTenant) => {
          this.tenants = this.tenants.map((existing) =>
            existing.id === updatedTenant.id ? updatedTenant : existing,
          );
          this.applySearchFilter();
          this.snackBar.open('✅ Room assignment updated.', 'Dismiss', {
            duration: 3000,
          });
          this.loadRooms();
        },
        error: (error) => {
          console.error('❌ Failed to update room assignment:', error);
          this.snackBar.open(
            '❌ Unable to update room assignment. Please try again.',
            'Dismiss',
            { duration: 4000 },
          );
          this.applySearchFilter();
        },
      });
  }

  /**
   * Updates a tenant's renewal date while enforcing validation rules.
   */
  onRenewalDateChange(tenant: Tenant, newDate: Date | null): void {
    if (!tenant.id) {
      this.snackBar.open('⚠️ Tenant identifier is missing.', 'Dismiss', {
        duration: 4000,
      });
      return;
    }

    const tenantId = tenant.id;

    this.refreshMinRenewalDate();

    const currentValue = this.normalizeDateForComparison(tenant.renewalDate);
    const nextValue = this.normalizeDateForComparison(newDate);
    const minValue = this.normalizeDateForComparison(this.minRenewalDate);

    if (nextValue !== null && minValue !== null && nextValue < minValue) {
      this.snackBar.open('⚠️ Renewal date cannot be in the past.', 'Dismiss', {
        duration: 4000,
      });
      this.tenants = [...this.tenants];
      this.applySearchFilter();
      return;
    }

    if (currentValue === nextValue) {
      return;
    }

    const payload = {
      renewalDate: newDate ? this.toUtcIsoDate(newDate) : null,
      due: false,
    };

    this.updatingTenantIds.add(tenantId);

    this.tenantService
      .updateTenantProfile(tenantId, payload)
      .pipe(finalize(() => this.updatingTenantIds.delete(tenantId)))
      .subscribe({
        next: (updatedTenant) => {
          this.tenants = this.tenants.map((existing) =>
            existing.id === updatedTenant.id ? updatedTenant : existing,
          );
          this.applySearchFilter();
          this.snackBar.open('✅ Renewal date updated.', 'Dismiss', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('🗓️ Failed to update renewal date:', error);
          this.snackBar.open(
            '❌ Unable to update renewal date. Please try again.',
            'Dismiss',
            { duration: 4000 },
          );
          this.tenants = [...this.tenants];
          this.applySearchFilter();
        },
      });
  }

  /**
   * Clears the renewal date via the UI control.
   */
  clearRenewalDate(event: MouseEvent, tenant: Tenant): void {
    event.stopPropagation();
    this.onRenewalDateChange(tenant, null);
  }

  /**
   * Applies the search term to the tenant list.
   */
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applySearchFilter();
  }

  /**
   * Removes any active search filter.
   */
  clearSearch(): void {
    if (!this.hasSearchTerm) {
      return;
    }

    this.searchTerm = '';
    this.applySearchFilter();
  }

  /**
   * Disables room options that are already at capacity.
   */
  isRoomDisabled(room: Room, tenant: Tenant): boolean {
    const optionRoom = this.normalizeRoom(room?.roomNo);
    const currentRoom = this.normalizeRoom(tenant.roomNo);

    if (!optionRoom) {
      return false;
    }

    if (optionRoom === currentRoom) {
      return false;
    }

    const capacity = Math.max(room.capacity ?? 0, 0);
    if (capacity === 0) {
      return false;
    }

    const allocated = Math.max(room.allocatedCount ?? 0, 0);
    return allocated >= capacity;
  }

  /**
   * Generates the human-friendly label for room selection options.
   */
  getRoomLabel(room: Room): string {
    if (!room) {
      return 'Unknown';
    }

    const capacity = room.capacity ?? 0;
    const allocated = Math.max(room.allocatedCount ?? 0, 0);
    if (capacity <= 0) {
      return room.roomNo ?? 'Unknown';
    }

    return `${room.roomNo} (${allocated}/${capacity})`;
  }

  /**
   * Extracts the selected room identifier for the UI control.
   */
  getCurrentRoomValue(tenant: Tenant): string | null {
    return this.normalizeRoom(tenant?.roomNo);
  }

  /**
   * Normalizes a room value for option controls.
   */
  getRoomOptionValue(room: Room): string | null {
    return this.normalizeRoom(room?.roomNo);
  }

  /**
   * Loads tenants from the backend and primes the filtered view.
   */
  private loadTenants(): void {
    this.isLoadingTenants = true;
    this.tenantService
      .getTenants()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingTenants = false)),
      )
      .subscribe({
        next: (data) => {
          this.tenants = data ?? [];
          this.applySearchFilter();
        },
        error: (error) => {
          console.error('📡 Error fetching tenants:', error);
          this.snackBar.open('📡 Unable to load tenants.', 'Dismiss', {
            duration: 4000,
          });
          this.tenants = [];
          this.applySearchFilter();
        },
      });
  }

  /**
   * Loads room data used to populate room picker options.
   */
  private loadRooms(): void {
    this.isLoadingRooms = true;
    this.roomService
      .getRooms()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoadingRooms = false)),
      )
      .subscribe({
        next: (rooms) => {
          this.rooms = (rooms ?? []).sort((a, b) =>
            (a.roomNo ?? '').localeCompare(b.roomNo ?? '', undefined, {
              numeric: true,
              sensitivity: 'base',
            }),
          );
        },
        error: (error) => {
          console.error('🚪 Error fetching rooms:', error);
          this.snackBar.open('🚪 Unable to load rooms.', 'Dismiss', {
            duration: 4000,
          });
        },
      });
  }

  /**
   * Normalizes dates for reliable comparison semantics.
   */
  private normalizeDateForComparison(
    value: Date | string | null | undefined,
  ): number | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const midnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
    return midnight.getTime();
  }

  /**
   * Converts a Date into a UTC ISO string expected by the backend.
   */
  private toUtcIsoDate(date: Date): string {
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    return utcDate.toISOString();
  }

  /**
   * Computes the start-of-day for the current date.
   */
  private getStartOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * Refreshes the cached minimum renewal date to today's midnight.
   */
  private refreshMinRenewalDate(): void {
    const todayStart = this.getStartOfToday();
    if (this.minRenewalDate.getTime() !== todayStart.getTime()) {
      this.minRenewalDate = todayStart;
    }
  }

  /**
   * Trims room numbers while treating empty values as null.
   */
  private normalizeRoom(roomNo: string | null | undefined): string | null {
    if (!roomNo) {
      return null;
    }

    const trimmed = roomNo.trim();
    if (!trimmed) {
      return null;
    }

    return trimmed;
  }

  /**
   * Filters the tenant list based on the current search term.
   */
  private applySearchFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredTenants = [...this.tenants];
      return;
    }

    this.filteredTenants = this.tenants.filter((tenant) => {
      const name = (tenant.name ?? '').toLowerCase();
      const room = (tenant.roomNo ?? '').toLowerCase();
      return name.includes(term) || room.includes(term);
    });
  }
}
