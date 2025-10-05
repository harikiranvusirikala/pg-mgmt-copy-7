/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';

import {
  DashboardCounts,
  DashboardService,
  DashboardSummaryViewModel,
  TenantSummary,
} from '../../core/services/dashboard.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
})
/** Shows the admin dashboard with key stats and recent tenant activity. */
export class HomeComponent implements OnInit {
  loading = false;
  error?: string;

  counts: DashboardCounts = {
    totalActive: 0,
    vegCount: 0,
    nonVegCount: 0,
    totalCapacity: 0,
    allocatedCapacity: 0,
    vacantCapacity: 0,
  };

  topTenants: TenantSummary[] = [];
  paymentDueTenants: TenantSummary[] = [];

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.refreshData();
  }

  trackTenant(_index: number, tenant: TenantSummary): string {
    return tenant.id ?? `${tenant.name}-${tenant.roomNo ?? 'unassigned'}`;
  }

  private refreshData(): void {
    this.loading = true;
    this.error = undefined;

    this.dashboardService.loadSummary().subscribe({
      next: (summary) => this.handleSuccess(summary),
      error: (err) => this.handleError(err),
    });
  }

  private handleSuccess(summary: DashboardSummaryViewModel): void {
    this.loading = false;
    this.counts = summary.counts;
    this.topTenants = summary.topTenants ?? [];
    this.paymentDueTenants = summary.paymentDueTenants ?? [];
  }

  private handleError(error: unknown): void {
    console.error('🚨 Failed to load dashboard summary', error);
    this.loading = false;
    this.error =
      'Unable to load dashboard data right now. Please try again shortly.';
    this.counts = {
      totalActive: 0,
      vegCount: 0,
      nonVegCount: 0,
      totalCapacity: 0,
      allocatedCapacity: 0,
      vacantCapacity: 0,
    };
    this.topTenants = [];
    this.paymentDueTenants = [];
  }
}
