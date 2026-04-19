import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TestResultsStore } from '@/app/assignments/test-results.store';
import { TenantService } from '@/app/core/api/services/tenant.service';
import { AuthClaimsService } from '@/app/core/auth/auth-claims.service';
import type { TenantResponseDto } from '@/app/core/api/models/tenant.dto';
import type { AssignmentResultListItemDto } from '@/app/core/api/models/assignment.dto';

@Component({
  selector: 'app-test-results-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    FluidModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './test-results-list.page.html',
})
export class TestResultsListPage implements OnInit {
  readonly store = inject(TestResultsStore);
  private readonly tenantsApi = inject(TenantService);
  private readonly claims = inject(AuthClaimsService);
  private readonly router = inject(Router);

  /** Avoid NG0100 from assigning `[options]` after first CD (async HTTP). */
  readonly tenants = toSignal(
    this.tenantsApi.list().pipe(
      catchError(() => of([] as TenantResponseDto[])),
    ),
    { initialValue: [] as TenantResponseDto[] },
  );

  ngOnInit(): void {
    this.claims.syncFromAccessToken();
    this.store.loadPage(1);
  }

  onTenantChange(tenantId: string | number | null | undefined): void {
    if (tenantId == null || tenantId === '') {
      this.store.setTenantFilter(null);
      return;
    }
    this.store.setTenantFilter(String(tenantId));
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.store.pageSize();
    const first = event.first ?? 0;
    const page = Math.floor(first / rows) + 1;
    this.store.loadPage(page, rows);
  }

  statusSeverity(
    status: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' | null {
    const s = (status ?? '').toLowerCase().replace(/\s+/g, '');
    if (s === 'completed') {
      return 'success';
    }
    if (s.includes('await') && s.includes('manual')) {
      return 'warn';
    }
    return 'secondary';
  }

  statusLabel(status: string): string {
    const s = (status ?? '').toLowerCase().replace(/\s+/g, '');
    if (s === 'completed') {
      return 'Completed';
    }
    if (s.includes('await') && s.includes('manual')) {
      return 'Awaiting manual grading';
    }
    return status || '—';
  }

  viewReport(row: AssignmentResultListItemDto): void {
    const id = String(row.id ?? '').trim();
    if (!id) {
      return;
    }
    void this.router.navigate(['/assignments', id, 'report']);
  }
}
