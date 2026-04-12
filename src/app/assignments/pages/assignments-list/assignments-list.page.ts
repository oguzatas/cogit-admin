import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Assignment } from '@/app/assignments/assignments.models';
import { AssignmentsStore } from '@/app/assignments/assignments.store';

@Component({
  selector: 'app-assignments-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    RippleModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './assignments-list.page.html',
})
export class AssignmentsListPage {
  readonly store = inject(AssignmentsStore);
  private readonly router = inject(Router);

  openDetail(assignment: Assignment): void {
    this.store.selectAssignment(assignment.id);
    this.router.navigate(['/assignments', assignment.id]);
  }

  lifecycleSeverity(
    s: Assignment['lifecycleStatus'],
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' | null {
    switch (s) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warn';
      case 'closed':
        return 'secondary';
      default:
        return 'info';
    }
  }

  rollupSeverity(
    r: ReturnType<AssignmentsStore['rollupStatus']>,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' | null {
    switch (r) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      default:
        return 'secondary';
    }
  }

}
