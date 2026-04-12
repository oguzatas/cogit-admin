import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  Assignment,
  AssignmentParticipant,
  AssignmentRollupStatus,
} from '@/app/assignments/assignments.models';
import { AssignmentsStore } from '@/app/assignments/assignments.store';

@Component({
  selector: 'app-assignment-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    RippleModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './assignment-detail.page.html',
})
export class AssignmentDetailPage {
  readonly store = inject(AssignmentsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly routeAssignmentId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('assignmentId'))),
    { initialValue: null },
  );

  readonly assignment = computed(() => {
    const id = this.routeAssignmentId();
    if (!id) {
      return null;
    }
    return this.store.assignments().find((a) => a.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const id = this.routeAssignmentId();
      this.store.selectAssignment(id);
    });
  }

  goBack(): void {
    this.store.selectAssignment(null);
    this.router.navigate(['/assignments']);
  }

  rollupSeverity(
    rollup: AssignmentRollupStatus,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' | null {
    switch (rollup) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      default:
        return 'secondary';
    }
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

  participantSeverity(
    p: AssignmentParticipant,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' | null {
    switch (this.store.participantRowStatus(p)) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      default:
        return 'secondary';
    }
  }

  participantStatusLabel(p: AssignmentParticipant): string {
    switch (this.store.participantRowStatus(p)) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In progress';
      default:
        return 'Pending';
    }
  }
}
