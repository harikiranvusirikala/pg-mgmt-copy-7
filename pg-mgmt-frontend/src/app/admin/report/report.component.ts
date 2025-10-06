/* eslint-disable @angular-eslint/prefer-standalone */
import { Component, OnInit } from '@angular/core';
import { formatDate } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartOptions,
  TooltipItem,
  registerables,
} from 'chart.js';
import { forkJoin } from 'rxjs';

import {
  AllocationStatsPoint,
  DashboardService,
  MealStatsPoint,
} from '../../core/services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
  standalone: false,
})
/**
 * Renders historical charts for meal preferences and room allocations.
 */
export class ReportComponent implements OnInit {
  loading = false;
  error?: string;

  hasMealChartData = false;
  hasAllocationChartData = false;

  totalChartData: ChartData<'line'> = { labels: [], datasets: [] };
  vegChartData: ChartData<'line'> = { labels: [], datasets: [] };
  nonVegChartData: ChartData<'line'> = { labels: [], datasets: [] };
  allocatedChartData: ChartData<'line'> = { labels: [], datasets: [] };
  vacantChartData: ChartData<'line'> = { labels: [], datasets: [] };

  chartOptions: ChartOptions<'line'> = this.buildChartOptions();

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadCharts();
  }

  /**
   * Fetches both meal and allocation statistics in parallel.
   */
  private loadCharts(): void {
    this.loading = true;
    this.error = undefined;

    forkJoin({
      meal: this.dashboardService.loadMealStats(),
      allocation: this.dashboardService.loadAllocationStats(),
    }).subscribe({
      next: ({ meal, allocation }) => this.handleSuccess(meal, allocation),
      error: (err) => this.handleError(err),
    });
  }

  /**
   * Populates chart datasets following a successful API response.
   */
  private handleSuccess(
    mealStats: MealStatsPoint[],
    allocationStats: AllocationStatsPoint[],
  ): void {
    this.loading = false;
    this.configureMealCharts(mealStats ?? []);
    this.configureAllocationCharts(allocationStats ?? []);
  }

  /**
   * Resets chart state and surfaces an error when data retrieval fails.
   */
  private handleError(error: unknown): void {
    console.error('📉 Failed to load report charts', error);
    this.loading = false;
    this.error =
      'Unable to load report charts right now. Please try again shortly.';
    this.resetMealCharts();
    this.resetAllocationCharts();
  }

  /**
   * Builds chart data series for meal preference trends.
   */
  private configureMealCharts(stats: MealStatsPoint[]): void {
    if (!stats.length) {
      this.hasMealChartData = false;
      this.resetMealCharts();
      return;
    }

    const orderedStats = [...stats].sort((a, b) => {
      const aDate = this.parseStatsDate(a.statsDate).getTime();
      const bDate = this.parseStatsDate(b.statsDate).getTime();

      if (aDate !== bDate) {
        return aDate - bDate;
      }

      return a.mealNo - b.mealNo;
    });

    const labels = orderedStats.map((stat) => this.buildMealLabel(stat));

    this.totalChartData = {
      labels,
      datasets: [
        {
          label: 'Total Active Tenants',
          data: orderedStats.map((stat) => stat.totalCount),
          fill: false,
          borderColor: 'rgba(37, 99, 235, 1)',
          backgroundColor: 'rgba(37, 99, 235, 0.16)',
          tension: 0.3,
          pointRadius: 3,
          spanGaps: true,
          pointBackgroundColor: 'rgba(37, 99, 235, 1)',
        },
      ],
    } satisfies ChartData<'line'>;

    this.vegChartData = {
      labels,
      datasets: [
        {
          label: 'Veg Preference',
          data: orderedStats.map((stat) => stat.vegCount),
          fill: false,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.16)',
          tension: 0.3,
          pointRadius: 3,
          spanGaps: true,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        },
      ],
    } satisfies ChartData<'line'>;

    this.nonVegChartData = {
      labels,
      datasets: [
        {
          label: 'Non-Veg Preference',
          data: orderedStats.map((stat) => stat.nonVegCount),
          fill: false,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.16)',
          tension: 0.3,
          pointRadius: 3,
          spanGaps: true,
          pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        },
      ],
    } satisfies ChartData<'line'>;

    this.hasMealChartData = true;
  }

  /**
   * Builds chart data series for room allocation trends.
   */
  private configureAllocationCharts(stats: AllocationStatsPoint[]): void {
    if (!stats.length) {
      this.hasAllocationChartData = false;
      this.resetAllocationCharts();
      return;
    }

    const orderedStats = [...stats].sort((a, b) => {
      const aTime = this.parseStatsDate(a.statsDate).getTime();
      const bTime = this.parseStatsDate(b.statsDate).getTime();
      return aTime - bTime;
    });

    const labels = orderedStats.map((stat) => this.buildAllocationLabel(stat));

    this.allocatedChartData = {
      labels,
      datasets: [
        {
          label: 'Allocated Beds',
          data: orderedStats.map((stat) => stat.allocatedCount),
          fill: false,
          borderColor: 'rgba(217, 119, 6, 1)',
          backgroundColor: 'rgba(217, 119, 6, 0.18)',
          tension: 0.3,
          pointRadius: 3,
          spanGaps: true,
          pointBackgroundColor: 'rgba(217, 119, 6, 1)',
        },
      ],
    } satisfies ChartData<'line'>;

    this.vacantChartData = {
      labels,
      datasets: [
        {
          label: 'Vacant Beds',
          data: orderedStats.map((stat) => stat.vacantCount),
          fill: false,
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.18)',
          tension: 0.3,
          pointRadius: 3,
          spanGaps: true,
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        },
      ],
    } satisfies ChartData<'line'>;

    this.hasAllocationChartData = true;
  }

  /**
   * Creates the display label for a meal statistics point.
   */
  private buildMealLabel(stat: MealStatsPoint): string {
    const date = this.parseStatsDate(stat.statsDate);
    const formatted = formatDate(date, 'd/MM', 'en-US');
    return `${formatted} - ${stat.mealNo}`;
  }

  /**
   * Creates the display label for an allocation statistics point.
   */
  private buildAllocationLabel(stat: AllocationStatsPoint): string {
    const date = this.parseStatsDate(stat.statsDate);
    return formatDate(date, 'd/MM', 'en-US');
  }

  /**
   * Produces consistent chart configuration shared by all graphs.
   */
  private buildChartOptions(): ChartOptions<'line'> {
    const textPrimary = this.getCssVar('--text-primary', '#0f172a');
    const textMuted = this.getCssVar('--text-muted', '#64748b');

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textPrimary,
          },
        },
        tooltip: {
          callbacks: {
            label(context: TooltipItem<'line'>) {
              const datasetLabel = context.dataset.label ?? 'Value';
              return `${datasetLabel}: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textMuted,
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: textMuted,
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
        },
      },
    } satisfies ChartConfiguration<'line'>['options'];
  }

  /**
   * Looks up a CSS custom property or falls back to a hard-coded value.
   */
  private getCssVar(token: string, fallback: string): string {
    if (typeof window === 'undefined') {
      return fallback;
    }

    const value = getComputedStyle(document.documentElement).getPropertyValue(
      token,
    );
    return value?.trim() || fallback;
  }

  /**
   * Resets meal chart datasets to an empty state.
   */
  private resetMealCharts(): void {
    this.totalChartData = { labels: [], datasets: [] };
    this.vegChartData = { labels: [], datasets: [] };
    this.nonVegChartData = { labels: [], datasets: [] };
    this.hasMealChartData = false;
  }

  /**
   * Resets allocation chart datasets to an empty state.
   */
  private resetAllocationCharts(): void {
    this.allocatedChartData = { labels: [], datasets: [] };
    this.vacantChartData = { labels: [], datasets: [] };
    this.hasAllocationChartData = false;
  }

  /**
   * Parses the stats date, tolerating null/invalid input by returning now.
   */
  private parseStatsDate(value: string | Date | null | undefined): Date {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    return new Date();
  }
}
