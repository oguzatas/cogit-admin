import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { Tenant } from '@/app/tenants/tenants.models';
import { TenantsStore } from '@/app/tenants/tenants.store';

@Component({
  selector: 'app-tenants-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    RippleModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    ConfirmDialogModule,
  ],
  templateUrl: './tenants-list.page.html',
  providers: [ConfirmationService],
})
export class TenantsListPage {
  readonly store = inject(TenantsStore);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmationService);

  tenantDialogVisible = false;
  dialogTenantId: string | null = null;
  dialogName = '';
  dialogDescription = '';

  openNew(): void {
    this.dialogTenantId = null;
    this.dialogName = '';
    this.dialogDescription = '';
    this.tenantDialogVisible = true;
  }

  openEdit(tenant: Tenant): void {
    this.dialogTenantId = tenant.id;
    this.dialogName = tenant.name;
    this.dialogDescription = tenant.description;
    this.tenantDialogVisible = true;
  }

  hideTenantDialog(): void {
    this.tenantDialogVisible = false;
  }

  saveTenant(): void {
    const name = this.dialogName.trim();
    if (!name) {
      return;
    }
    if (this.dialogTenantId) {
      this.store.updateTenant(this.dialogTenantId, {
        name,
        description: this.dialogDescription,
      });
    } else {
      const id = this.store.createTenant({
        name,
        description: this.dialogDescription,
      });
      this.store.selectTenant(id);
      this.router.navigate(['/tenants', id]);
    }
    this.hideTenantDialog();
  }

  openTenantDetail(tenant: Tenant): void {
    this.store.selectTenant(tenant.id);
    this.router.navigate(['/tenants', tenant.id]);
  }

  confirmDeleteTenant(tenant: Tenant): void {
    this.confirmation.confirm({
      header: 'Delete tenant',
      message: `Delete "${tenant.name}" and all of its departments, employees, invites, and distributions? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.store.deleteTenant(tenant.id),
    });
  }

  departmentCount(tenant: Tenant): number {
    return tenant.departments.length;
  }
}
