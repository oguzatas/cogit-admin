/** Lifecycle set by admin; progress is derived from participants. */
export type AssignmentLifecycleStatus = 'draft' | 'active' | 'closed';

/** Per-employee row on an assignment (opens + completions tracked locally). */
export interface AssignmentParticipant {
  tenantEmployeeId: string;
  displayName: string;
  email: string;
  /** When the employee first opened the assignment (link or in-app). */
  openedAt: string | null;
  /** When the employee submitted / finished the test. */
  completedAt: string | null;
  /** Admin-visible result line (score band, pass/fail, etc.). */
  resultLabel: string | null;
}

/** A test deployed to a tenant with per-employee tracking. */
export interface Assignment {
  id: string;
  testTitle: string;
  tenantId: string;
  tenantName: string;
  /** Human-readable scope, e.g. "Cardiology, Reception". */
  departmentScopeLabel: string;
  lifecycleStatus: AssignmentLifecycleStatus;
  createdAt: string;
  participants: AssignmentParticipant[];
}

export type ParticipantRowStatus = 'pending' | 'in_progress' | 'completed';

export type AssignmentRollupStatus = 'not_started' | 'in_progress' | 'completed';
