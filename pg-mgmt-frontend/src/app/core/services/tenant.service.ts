import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiConfig } from '../config/api.config';
import { Tenant } from './auth.service';

type TenantProfileUpdatePayload = Partial<
  Pick<Tenant, 'phone' | 'mealPreference' | 'continuousStay' | 'due'>
> & {
  renewalDate?: Date | string | null;
};

@Injectable({ providedIn: 'root' })
/** Coordinates tenant CRUD operations with the Spring backend. */
export class TenantService {
  private readonly apiUrl = ApiConfig.tenants; // Spring Boot backend

  constructor(private readonly http: HttpClient) {}

  getTenants(): Observable<Tenant[]> {
    return this.http
      .get<Tenant[]>(this.apiUrl)
      .pipe(map((tenants) => this.normalizeTenants(tenants)));
  }

  addTenant(tenant: any): Observable<Tenant> {
    return this.http
      .post<Tenant>(this.apiUrl, tenant)
      .pipe(
        map((createdTenant) => this.normalizeTenant(createdTenant) as Tenant),
      );
  }

  getTenantByEmail(email: string): Observable<Tenant | null> {
    return this.http
      .get<Tenant>(`${this.apiUrl}/${encodeURIComponent(email)}`)
      .pipe(map((tenant) => this.normalizeTenant(tenant)));
  }

  updateTenantStatus(id: string, isActive: boolean): Observable<Tenant> {
    return this.http
      .patch<Tenant>(`${this.apiUrl}/${id}/status`, { isActive })
      .pipe(map((tenant) => this.normalizeTenant(tenant) as Tenant));
  }

  updateTenantProfile(
    id: string,
    payload: TenantProfileUpdatePayload,
  ): Observable<Tenant> {
    return this.http
      .patch<Tenant>(`${this.apiUrl}/${id}/profile`, payload)
      .pipe(map((tenant) => this.normalizeTenant(tenant) as Tenant));
  }

  updateTenantRoom(id: string, roomNo: string | null): Observable<Tenant> {
    return this.http
      .patch<Tenant>(`${this.apiUrl}/${id}/room`, { roomNo })
      .pipe(map((tenant) => this.normalizeTenant(tenant) as Tenant));
  }

  private normalizeTenant(tenant: Tenant | null): Tenant | null {
    if (!tenant) {
      return null;
    }

    const { active, renewalDate, ...rest } = tenant as Tenant & {
      active?: boolean;
      renewalDate?: string | Date | null;
    };

    const normalizedRenewalDate = this.normalizeRenewalDate(
      renewalDate ?? null,
    );

    return {
      ...rest,
      renewalDate: normalizedRenewalDate,
      isActive: rest.isActive ?? active ?? false,
    };
  }

  private normalizeTenants(tenants: Tenant[] | null): Tenant[] {
    if (!tenants) {
      return [];
    }

    return tenants
      .map((tenant) => this.normalizeTenant(tenant))
      .filter((tenant): tenant is Tenant => tenant !== null);
  }

  private normalizeRenewalDate(
    renewalDate: string | Date | null | undefined,
  ): Date | undefined {
    if (!renewalDate) {
      return undefined;
    }

    if (renewalDate instanceof Date) {
      return renewalDate;
    }

    const parsed = Date.parse(renewalDate);
    return Number.isNaN(parsed) ? undefined : new Date(parsed);
  }
}
