import { computed, Injectable, signal } from '@angular/core';
import {
  Assignment,
  AssignmentParticipant,
  AssignmentRollupStatus,
  ParticipantRowStatus,
} from './assignments.models';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `asg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function seedAssignments(): Assignment[] {
  const t1 = '2026-04-08T09:00:00.000Z';
  const t2 = '2026-04-09T14:30:00.000Z';
  const t3 = '2026-04-10T11:15:00.000Z';
  const t4 = '2026-04-10T16:45:00.000Z';

  return [
    {
      id: 'asg-safety-001',
      testTitle: 'Annual safety assessment',
      tenantId: 'tenant-demo-acme',
      tenantName: 'Acme Clinics',
      departmentScopeLabel: 'Clinical · Reception',
      lifecycleStatus: 'active',
      createdAt: t1,
      participants: [
        {
          tenantEmployeeId: 'emp-1',
          displayName: 'Maya Chen',
          email: 'maya.chen@acme.example',
          openedAt: t2,
          completedAt: t4,
          resultLabel: 'Score 88 · Pass',
        },
        {
          tenantEmployeeId: 'emp-2',
          displayName: 'Jon Rivera',
          email: 'jon.rivera@acme.example',
          openedAt: t3,
          completedAt: null,
          resultLabel: null,
        },
        {
          tenantEmployeeId: 'emp-3',
          displayName: 'Sam Okonkwo',
          email: 'sam.okonkwo@acme.example',
          openedAt: null,
          completedAt: null,
          resultLabel: null,
        },
      ],
    },
    {
      id: 'asg-onboard-002',
      testTitle: 'New hire onboarding checklist',
      tenantId: 'tenant-demo-northwind',
      tenantName: 'Northwind Logistics',
      departmentScopeLabel: 'Warehouse · HQ',
      lifecycleStatus: 'active',
      createdAt: t2,
      participants: [
        {
          tenantEmployeeId: 'emp-4',
          displayName: 'Alex Morgan',
          email: 'alex.morgan@northwind.example',
          openedAt: t2,
          completedAt: t2,
          resultLabel: 'Completed · 100%',
        },
        {
          tenantEmployeeId: 'emp-5',
          displayName: 'Priya Singh',
          email: 'priya.singh@northwind.example',
          openedAt: t3,
          completedAt: t3,
          resultLabel: 'Completed · 96%',
        },
      ],
    },
    {
      id: 'asg-wellness-003',
      testTitle: 'Quarterly wellness survey',
      tenantId: 'tenant-demo-acme',
      tenantName: 'Acme Clinics',
      departmentScopeLabel: 'All departments',
      lifecycleStatus: 'draft',
      createdAt: t4,
      participants: [
        {
          tenantEmployeeId: 'emp-6',
          displayName: 'Taylor Brooks',
          email: 'taylor.brooks@acme.example',
          openedAt: null,
          completedAt: null,
          resultLabel: null,
        },
      ],
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class AssignmentsStore {
  readonly assignments = signal<Assignment[]>(seedAssignments());
  readonly selectedAssignmentId = signal<string | null>(null);

  readonly selectedAssignment = computed(() => {
    const id = this.selectedAssignmentId();
    if (!id) {
      return null;
    }
    return this.assignments().find((a) => a.id === id) ?? null;
  });

  readonly assignmentCount = computed(() => this.assignments().length);

  selectAssignment(assignmentId: string | null): void {
    this.selectedAssignmentId.set(assignmentId);
  }

  counts(assignment: Assignment): {
    total: number;
    opened: number;
    completed: number;
  } {
    const total = assignment.participants.length;
    const opened = assignment.participants.filter((p) => p.openedAt != null).length;
    const completed = assignment.participants.filter((p) => p.completedAt != null).length;
    return { total, opened, completed };
  }

  rollupStatus(assignment: Assignment): AssignmentRollupStatus {
    const { total, completed, opened } = this.counts(assignment);
    if (total === 0) {
      return 'not_started';
    }
    if (completed === total) {
      return 'completed';
    }
    if (opened === 0 && completed === 0) {
      return 'not_started';
    }
    return 'in_progress';
  }

  rollupStatusLabel(rollup: AssignmentRollupStatus): string {
    switch (rollup) {
      case 'completed':
        return 'Everyone done';
      case 'in_progress':
        return 'In progress';
      default:
        return 'Not started';
    }
  }

  participantRowStatus(participant: AssignmentParticipant): ParticipantRowStatus {
    if (participant.completedAt) {
      return 'completed';
    }
    if (participant.openedAt) {
      return 'in_progress';
    }
    return 'pending';
  }

  /**
   * Local-only mutations for future wiring; optional for demos.
   */
  markParticipantOpened(assignmentId: string, tenantEmployeeId: string): void {
    const stamp = new Date().toISOString();
    this.assignments.update((list) =>
      list.map((a) => {
        if (a.id !== assignmentId) {
          return a;
        }
        return {
          ...a,
          participants: a.participants.map((p) =>
            p.tenantEmployeeId === tenantEmployeeId && !p.openedAt
              ? { ...p, openedAt: stamp }
              : p,
          ),
        };
      }),
    );
  }

  markParticipantCompleted(
    assignmentId: string,
    tenantEmployeeId: string,
    resultLabel: string,
  ): void {
    const stamp = new Date().toISOString();
    this.assignments.update((list) =>
      list.map((a) => {
        if (a.id !== assignmentId) {
          return a;
        }
        return {
          ...a,
          participants: a.participants.map((p) =>
            p.tenantEmployeeId === tenantEmployeeId
              ? {
                  ...p,
                  openedAt: p.openedAt ?? stamp,
                  completedAt: stamp,
                  resultLabel,
                }
              : p,
          ),
        };
      }),
    );
  }

  /** Scaffold for when assignments are created from distribution UI. */
  addAssignmentDraft(payload: {
    testTitle: string;
    tenantId: string;
    tenantName: string;
    departmentScopeLabel: string;
    participants: Omit<
      AssignmentParticipant,
      'openedAt' | 'completedAt' | 'resultLabel'
    >[];
  }): string {
    const id = createId();
    const row: Assignment = {
      id,
      testTitle: payload.testTitle.trim(),
      tenantId: payload.tenantId,
      tenantName: payload.tenantName,
      departmentScopeLabel: payload.departmentScopeLabel.trim(),
      lifecycleStatus: 'draft',
      createdAt: new Date().toISOString(),
      participants: payload.participants.map((p) => ({
        ...p,
        openedAt: null,
        completedAt: null,
        resultLabel: null,
      })),
    };
    this.assignments.update((list) => [row, ...list]);
    return id;
  }
}
