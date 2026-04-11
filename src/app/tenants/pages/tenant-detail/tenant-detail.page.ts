import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import {
  Department,
  InviteLink,
  Tenant,
  TenantEmployee,
  TenantTestDistribution,
} from '@/app/tenants/tenants.models';
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
  ],
  templateUrl: './tenant-detail.page.html',
  providers: [ConfirmationService],
})
export class TenantDetailPage {
  readonly store = inject(TenantsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);

  readonly routeTenantId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('tenantId'))),
    { initialValue: null },
  );

  readonly tenant = computed(() => {
    const id = this.routeTenantId();
    if (!id) {
      return null;
    }
    return this.store.tenants().find((t) => t.id === id) ?? null;
  });

  /** Main configuration tabs */
  mainTab = '0';
  /** Nested onboarding: silent vs invite */
  onboardTab = '0';

  deptDialogVisible = false;
  deptEditId: string | null = null;
  deptName = '';

  silentDepartmentId = '';
  silentName = '';
  silentEmail = '';

  inviteDialogVisible = false;
  inviteDepartmentId = '';
  inviteMaxUses = 60;
  /** Whole hours until absolute expiry. */
  inviteValidHours = 1;

  distDialogVisible = false;
  distTitle = '';
  distDepartmentIds: string[] = [];

  constructor() {
    effect(() => {
      const id = this.routeTenantId();
      this.store.selectTenant(id);
    });
  }

  goBack(): void {
    this.store.selectTenant(null);
    this.router.navigate(['/tenants']);
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
    if (!t) {
      return;
    }
    const name = this.deptName.trim();
    if (!name) {
      return;
    }
    if (this.deptEditId) {
      this.store.updateDepartment(t.id, this.deptEditId, name);
    } else {
      this.store.addDepartment(t.id, name);
    }
    this.hideDeptDialog();
  }

  confirmDeleteDepartment(dept: Department): void {
    const t = this.tenant();
    if (!t) {
      return;
    }
    this.confirmation.confirm({
      header: 'Delete department',
      message: `Delete "${dept.name}"? Employees in this department will be removed. Invite links and distribution rows targeting it will be cleaned up.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.store.deleteDepartment(t.id, dept.id),
    });
  }

  departmentOptions(tenant: Tenant): { label: string; value: string }[] {
    return tenant.departments.map((d) => ({ label: d.name, value: d.id }));
  }

  submitSilentProvision(): void {
    const t = this.tenant();
    if (!t || !this.silentDepartmentId) {
      return;
    }
    this.store.provisionEmployeeSilent(
      t.id,
      this.silentDepartmentId,
      this.silentName,
      this.silentEmail,
    );
    this.silentName = '';
    this.silentEmail = '';
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
    if (!t || !this.inviteDepartmentId) {
      return;
    }
    this.store.createInviteLink(
      t.id,
      this.inviteDepartmentId,
      this.inviteMaxUses,
      this.inviteValidHours,
    );
    this.hideInviteDialog();
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
      accept: () => this.store.revokeInviteLink(t.id, link.id),
    });
  }

  openDistDialog(): void {
    this.distTitle = '';
    this.distDepartmentIds = [];
    this.distDialogVisible = true;
  }

  hideDistDialog(): void {
    this.distDialogVisible = false;
  }

  saveDistribution(): void {
    const t = this.tenant();
    if (!t) {
      return;
    }
    this.store.addTestDistribution(t.id, {
      testTitle: this.distTitle,
      departmentIds: this.distDepartmentIds,
    });
    this.hideDistDialog();
  }

  confirmRemoveDistribution(row: TenantTestDistribution): void {
    const t = this.tenant();
    if (!t) {
      return;
    }
    this.confirmation.confirm({
      header: 'Remove distribution',
      message: `Remove assignment "${row.testTitle}"?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.store.removeTestDistribution(t.id, row.id),
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

  employeesFlat(tenant: Tenant): { departmentName: string; employee: TenantEmployee }[] {
    const rows: { departmentName: string; employee: TenantEmployee }[] = [];
    for (const d of tenant.departments) {
      for (const e of d.employees) {
        rows.push({ departmentName: d.name, employee: e });
      }
    }
    return rows;
  }
}
