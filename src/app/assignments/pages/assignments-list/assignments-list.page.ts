import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FluidModule } from 'primeng/fluid';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AssignmentsStore } from '@/app/assignments/assignments.store';
import type { TenantEmployeeListItemDto } from '@/app/core/api/models/tenant-employee.dto';

@Component({
  selector: 'app-assignments-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    FluidModule,
    ProgressSpinnerModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './assignments-list.page.html',
})
export class AssignmentsListPage implements OnInit {
  readonly store = inject(AssignmentsStore);
  private readonly messages = inject(MessageService);

  readonly dialogHeader = computed(() => {
    const emp = this.store.dialogEmployee();
    return emp ? `${emp.fullName} — Assignments` : 'Employee Assignments';
  });

  ngOnInit(): void {
    this.store.loadTenants();
    this.store.loadTests();
  }

  onAssignTenantChange(tenantId: string | null): void {
    this.store.selectAssignTenant(tenantId);
  }

  onFilterTenantChange(tenantId: string | null): void {
    this.store.selectFilterTenant(tenantId);
  }

  onFilterDepartmentChange(departmentId: string | null): void {
    this.store.selectFilterDepartment(departmentId);
  }

  onEmployeeLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = this.store.employeePageSize();
    const page = Math.floor((event.first ?? 0) / pageSize) + 1;
    this.store.loadEmployees(page);
  }

  openDialog(emp: TenantEmployeeListItemDto): void {
    this.store.openAssignmentDialog(emp);
  }

  onDialogHide(): void {
    this.store.closeAssignmentDialog();
  }

  copyMagicLink(accessKey: string): void {
    const url = this.store.magicLink(accessKey);
    navigator.clipboard.writeText(url).then(() => {
      this.messages.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'Magic link copied to clipboard.',
        life: 2000,
      });
    });
  }
}
