import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiConfig } from '../config/api.config';

export interface DashboardCounts {
  totalActive: number;
  vegCount: number;
  nonVegCount: number;
  totalCapacity: number;
  allocatedCapacity: number;
  vacantCapacity: number;
}

export interface TenantSummary {
  id?: string;
  name: string;
  roomNo?: string | null;
  renewalDate?: string | null;
}

export interface MealStatsPoint {
  statsDate: string;
  mealNo: number;
  totalCount: number;
  vegCount: number;
  nonVegCount: number;
}

export interface AllocationStatsPoint {
  statsDate: string;
  totalCount: number;
  allocatedCount: number;
  vacantCount: number;
}

export interface DashboardSummaryResponse {
  counts: DashboardCounts;
  topTenants: TenantSummary[];
  paymentDueTenants: TenantSummary[];
}

export interface DashboardSummaryViewModel {
  counts: DashboardCounts;
  topTenants: TenantSummary[];
  paymentDueTenants: TenantSummary[];
}

@Injectable({ providedIn: 'root' })
/** Coordinates dashboard API calls and normalizes responses for the admin home view. */
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  loadSummary(): Observable<DashboardSummaryViewModel> {
    return this.http
      .get<DashboardSummaryResponse>(`${ApiConfig.dashboard}/summary`)
      .pipe(map((response) => this.normalizeSummary(response)));
  }

  loadMealStats(): Observable<MealStatsPoint[]> {
    return this.http
      .get<MealStatsPoint[]>(`${ApiConfig.dashboard}/meal-stats`)
      .pipe(map((stats) => this.normalizeStatsPoints(stats)));
  }

  loadAllocationStats(): Observable<AllocationStatsPoint[]> {
    return this.http
      .get<AllocationStatsPoint[]>(`${ApiConfig.dashboard}/allocation-stats`)
      .pipe(map((stats) => this.normalizeStatsPoints(stats)));
  }

  private normalizeSummary(
    response: DashboardSummaryResponse,
  ): DashboardSummaryViewModel {
    return {
      counts: response.counts ?? {
        totalActive: 0,
        vegCount: 0,
        nonVegCount: 0,
        totalCapacity: 0,
        allocatedCapacity: 0,
        vacantCapacity: 0,
      },
      topTenants: response.topTenants ?? [],
      paymentDueTenants: response.paymentDueTenants ?? [],
    };
  }

  private normalizeStatsPoints<T extends { statsDate: string }>(
    stats: T[] | null | undefined,
  ): T[] {
    return (stats ?? []).map((stat) => ({
      ...stat,
      statsDate: stat.statsDate,
    }));
  }
}
