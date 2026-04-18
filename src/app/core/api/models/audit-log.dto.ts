/** GET `/api/AuditLogs` (optional) — admin activity feed. */
export type AuditLogSeverity = 'success' | 'info' | 'warn' | 'danger';

export interface AuditLogEntryDto {
  id: string;
  message: string;
  /** One or two letters for avatar */
  actorInitials: string;
  actorEmail?: string | null;
  /** ISO-8601 */
  occurredAt: string;
  severity: AuditLogSeverity;
}
