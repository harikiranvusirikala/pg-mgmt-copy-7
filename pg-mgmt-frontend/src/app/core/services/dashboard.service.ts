import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApiConfig } from '../config/api.config';

/**
 * Aggregate counts reflecting active tenants and room capacity usage.
 */
export interface DashboardCounts {
  totalActive: number;
  vegCount: number;
  nonVegCount: number;
  totalCapacity: number;
  allocatedCapacity: number;
  vacantCapacity: number;
}

/**
 * Minimal tenant information displayed in dashboard lists.
 */
export interface TenantSummary {
  id?: string;
  name: string;
  roomNo?: string | null;
  renewalDate?: string | null;
}

/**
 * Represents a single time series point for meal preference statistics.
 */
export interface MealStatsPoint {
  statsDate: string;
  mealNo: number;
  totalCount: number;
  vegCount: number;
  nonVegCount: number;
}

/**
 * Represents a single time series point for room allocation statistics.
 */
export interface AllocationStatsPoint {
  statsDate: string;
  totalCount: number;
  allocatedCount: number;
  vacantCount: number;
}

/**
 * Raw dashboard summary response returned by the backend.
 */
export interface DashboardSummaryResponse {
  counts: DashboardCounts;
  topTenants: TenantSummary[];
  paymentDueTenants: TenantSummary[];
}

/**
 * Normalized dashboard view model consumed by UI components.
 */
export interface DashboardSummaryViewModel {
  counts: DashboardCounts;
  topTenants: TenantSummary[];
  paymentDueTenants: TenantSummary[];
}

@Injectable({ providedIn: 'root' })
/**
 * Retrieves dashboard statistics and transforms them into UI-friendly shapes.
 */
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Loads the dashboard summary and normalizes missing values.
   */
  loadSummary(): Observable<DashboardSummaryViewModel> {
    return this.http
      .get<DashboardSummaryResponse>(`${ApiConfig.dashboard}/summary`)
      .pipe(map((response) => this.normalizeSummary(response)));
  }

  /**
   * Fetches meal statistics time series for the report charts.
   */
  loadMealStats(): Observable<MealStatsPoint[]> {
    return this.http
      .get<MealStatsPoint[]>(`${ApiConfig.dashboard}/meal-stats`)
      .pipe(map((stats) => this.normalizeStatsPoints(stats)));
  }

  /**
   * Fetches room allocation time series for the report charts.
   */
  loadAllocationStats(): Observable<AllocationStatsPoint[]> {
    return this.http
      .get<AllocationStatsPoint[]>(`${ApiConfig.dashboard}/allocation-stats`)
      .pipe(map((stats) => this.normalizeStatsPoints(stats)));
  }

  /**
   * Ensures the summary payload always contains safe default structures.
   */
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

  /**
   * Normalizes time series points to guard against null responses.
   */
  private normalizeStatsPoints<T extends { statsDate: string }>(
    stats: T[] | null | undefined,
  ): T[] {
    return (stats ?? []).map((stat) => ({
      ...stat,
      statsDate: stat.statsDate,
    }));
  }
}
