import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TestService } from '@/app/core/api/services/test.service';
import {
  Department,
  InviteLink,
  Tenant,
  TenantTestDistribution,
} from '@/app/tenants/tenants.models';
import { TenantPeopleTableComponent } from '@/app/tenants/components/tenant-people-table/tenant-people-table.component';
import { TenantsStore } from '@/app/tenants/tenants.store';

@Component({
  selector: 'app-tenant-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    TabsModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    TenantPeopleTableComponent,
  ],
  templateUrl: './tenant-detail.page.html',
  providers: [ConfirmationService],
})
export class TenantDetailPage {
  readonly store = inject(TenantsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);
  private readonly testsApi = inject(TestService);

  readonly routeTenantId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('tenantId'))),
    { initialValue: null },
  );

  readonly tenant = computed(() => {
    const id = this.routeTenantId();
    if (!id) {
      return null;
    }
    const sid = String(id);
    return (
      this.store.tenants().find((t) => String(t.id) === sid) ?? null
    );
  });

  readonly testOptions = signal<{ label: string; value: string }[]>([]);
  readonly testsLoading = signal(false);

  mainTab = '0';
  onboardTab = '0';

  deptDialogVisible = false;
  deptEditId: string | null = null;
  deptName = '';
  deptSavePending = false;

  silentDepartmentId = '';
  silentName = '';
  silentEmail = '';
  silentPending = false;

  inviteDialogVisible = false;
  inviteDepartmentId = '';
  inviteMaxUses = 60;
  inviteValidHours = 1;
  inviteCreatePending = false;

  distDialogVisible = false;
  distTestId = '';
  distDepartmentIds: string[] = [];
  distSavePending = false;

  constructor() {
    effect((onCleanup) => {
      const id = this.routeTenantId();
      this.store.selectTenant(id);
      if (!id) {
        return;
      }
      const sub = this.store.hydrateTenant$(id).subscribe({ error: () => {} });
      onCleanup(() => sub.unsubscribe());
    });
  }

  goBack(): void {
    this.store.selectTenant(null);
    void this.router.navigate(['/tenants']);
  }

  onMainTabChange(value: string | number | undefined): void {
    this.mainTab = value === undefined || value === null ? '0' : String(value);
  }

  onOnboardTabChange(value: string | number | undefined): void {
    this.onboardTab =
      value === undefined || value === null ? '0' : String(value);
  }

  openNewDepartment(): void {
    this.deptEditId = null;
    this.deptName = '';
    this.deptDialogVisible = true;
  }

  openEditDepartment(dept: Department): void {
    this.deptEditId = dept.id;
    this.deptName = dept.name;
    this.deptDialogVisible = true;
  }

  hideDeptDialog(): void {
    this.deptDialogVisible = false;
  }

  saveDepartment(): void {
    const t = this.tenant();
    if (!t || this.deptSavePending) {
      return;
    }
    const name = this.deptName.trim();
    if (!name) {
      return;
    }
    this.deptSavePending = true;
    if (this.deptEditId) {
      this.store
        .updateDepartment$(t.id, this.deptEditId, name)
        .subscribe({
          next: () => {
            this.deptSavePending = false;
            this.hideDeptDialog();
          },
          error: () => {
            this.deptSavePending = false;
          },
        });
    } else {
      this.store.addDepartment$(t.id, name).subscribe({
        next: () => {
          this.deptSavePending = false;
          this.hideDeptDialog();
        },
        error: () => {
          this.deptSavePending = false;
        },
      });
    }
  }

  confirmDeleteDepartment(dept: Department): void {
    const t = this.tenant();
    if (!t) {
      return;
    }
    this.confirmation.confirm({
      header: 'Delete department',
      message: `Delete "${dept.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.deleteDepartment$(t.id, dept.id).subscribe();
      },
    });
  }

  departmentOptions(tenant: Tenant): { label: string; value: string }[] {
    return tenant.departments.map((d) => ({ label: d.name, value: d.id }));
  }

  /** Labels for the tenant people table department filter (ids as strings). */
  peopleDepartmentFilterRows(
    tenant: Tenant,
  ): { id: string; name: string }[] {
    return tenant.departments.map((d) => ({
      id: String(d.id),
      name: d.name,
    }));
  }

  submitSilentProvision(): void {
    const t = this.tenant();
    if (!t || !this.silentDepartmentId || this.silentPending) {
      return;
    }
    this.silentPending = true;
    this.store
      .provisionEmployeeSilent$(
        t.id,
        this.silentDepartmentId,
        this.silentName,
        this.silentEmail,
      )
      .subscribe({
        next: () => {
          this.silentPending = false;
          this.silentName = '';
          this.silentEmail = '';
        },
        error: () => {
          this.silentPending = false;
        },
      });
  }

  openInviteDialog(): void {
    const t = this.tenant();
    this.inviteDepartmentId = t?.departments[0]?.id ?? '';
    this.inviteMaxUses = 60;
    this.inviteValidHours = 1;
    this.inviteDialogVisible = true;
  }

  hideInviteDialog(): void {
    this.inviteDialogVisible = false;
  }

  createInvite(): void {
    const t = this.tenant();
    if (!t || !this.inviteDepartmentId || this.inviteCreatePending) {
      return;
    }
    this.inviteCreatePending = true;
    this.store
      .createInviteLink$(
        t.id,
        this.inviteDepartmentId,
        this.inviteMaxUses,
        this.inviteValidHours,
      )
      .subscribe({
        next: () => {
          this.inviteCreatePending = false;
          this.hideInviteDialog();
        },
        error: () => {
          this.inviteCreatePending = false;
        },
      });
  }

  confirmRevokeInvite(link: InviteLink): void {
    const t = this.tenant();
    if (!t) {
      return;
    }
    this.confirmation.confirm({
      header: 'Revoke invite',
      message: 'This link will stop accepting new sign-ups immediately.',
      icon: 'pi pi-ban',
      acceptLabel: 'Revoke',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.revokeInviteLink$(t.id, link.id).subscribe();
      },
    });
  }

  private loadTestCatalog(): void {
    this.testsLoading.set(true);
    this.testsApi
      .list()
      .pipe(
        catchError(() => of([])),
        map((rows) =>
          rows.map((r) => ({ label: r.title, value: r.id })),
        ),
      )
      .subscribe({
        next: (opts) => {
          this.testOptions.set(opts);
          this.testsLoading.set(false);
        },
        error: () => this.testsLoading.set(false),
      });
  }

  openDistDialog(): void {
    this.distTestId = '';
    this.distDepartmentIds = [];
    this.distDialogVisible = true;
    this.loadTestCatalog();
  }

  hideDistDialog(): void {
    this.distDialogVisible = false;
  }

  saveDistribution(): void {
    const t = this.tenant();
    if (!t || !this.distTestId || this.distDepartmentIds.length === 0 || this.distSavePending) {
      return;
    }
    this.distSavePending = true;
    this.store
      .distributeTest$(t.id, this.distTestId, this.distDepartmentIds)
      .subscribe({
        next: () => {
          this.distSavePending = false;
          this.hideDistDialog();
        },
        error: () => {
          this.distSavePending = false;
        },
      });
  }

  confirmRemoveDistribution(row: TenantTestDistribution): void {
    const t = this.tenant();
    if (!t) {
      return;
    }
    if (!row.assignmentIds?.length) {
      return;
    }
    this.confirmation.confirm({
      header: 'Remove assignment',
      message: `Remove "${row.testTitle}" from the selected departments?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.store.removeTestDistribution$(t.id, row).subscribe();
      },
    });
  }

  invitePreviewPath(token: string): string {
    return `/join/${token}`;
  }

  inviteStatus(link: InviteLink): string {
    if (link.isRevoked) {
      return 'Revoked';
    }
    if (this.store.inviteLinkIsExpired(link)) {
      return 'Expired';
    }
    if (this.store.inviteLinkIsExhausted(link)) {
      return 'Exhausted';
    }
    return 'Active';
  }

  inviteSeverity(
    link: InviteLink,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null {
    if (link.isRevoked) {
      return 'secondary';
    }
    if (this.store.inviteLinkIsExpired(link)) {
      return 'warn';
    }
    if (this.store.inviteLinkIsExhausted(link)) {
      return 'warn';
    }
    return 'success';
  }

  departmentLabel(tenant: Tenant, departmentId: string): string {
    return tenant.departments.find((d) => d.id === departmentId)?.name ?? departmentId;
  }

  distributionDeptLabels(tenant: Tenant, row: TenantTestDistribution): string {
    return row.assignedDepartmentIds
      .map((id) => this.departmentLabel(tenant, id))
      .join(', ');
  }
}
