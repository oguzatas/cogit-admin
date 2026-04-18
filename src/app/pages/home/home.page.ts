import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { DashboardStore } from '@/app/dashboard/dashboard.store';
import { AuthClaimsService } from '@/app/core/auth/auth-claims.service';
import type { DashboardSnapshotDto } from '@/app/core/api/models/dashboard.dto';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AvatarModule,
    ButtonModule,
    ChartModule,
    SkeletonModule,
    TagModule,
    TimelineModule,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  readonly store = inject(DashboardStore);
  private readonly router = inject(Router);
  readonly claims = inject(AuthClaimsService);

  readonly pieKind = signal<'doughnut' | 'pie'>('doughnut');

  readonly lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
    scales: {
      x: {
        grid: { color: 'color-mix(in srgb, var(--surface-border) 55%, transparent)' },
        ticks: { color: 'var(--text-color-secondary)' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'color-mix(in srgb, var(--surface-border) 55%, transparent)' },
        ticks: { color: 'var(--text-color-secondary)', precision: 0 },
      },
    },
  };

  readonly pieChartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: this.pieKind() === 'doughnut' ? '58%' : '0%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
  }));

  constructor() {
    this.store.load();
  }

  fourthCardTitle(snap: DashboardSnapshotDto): string {
    return snap.kpis.fourthLabel === 'active_tenants' ? 'Active tenants' : 'Departments';
  }

  inviteTarget(): string {
    const tid = this.claims.tenantId();
    if (this.claims.isSuperAdmin()) {
      return '/tenants';
    }
    return tid ? `/tenants/${encodeURIComponent(tid)}` : '/tenants';
  }

  togglePieKind(): void {
    this.pieKind.update((k) => (k === 'doughnut' ? 'pie' : 'doughnut'));
  }

  reload(): void {
    this.store.load();
  }

  navigate(path: string): void {
    void this.router.navigateByUrl(path);
  }
}
