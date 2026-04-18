import type { AuditLogEntryDto, AuditLogSeverity } from '@/app/core/api/models/audit-log.dto';

function str(v: unknown): string {
  if (v == null) {
    return '';
  }
  return String(v);
}

function severity(raw: unknown): AuditLogSeverity {
  const s = str(raw).toLowerCase();
  if (s === 'success' || s === 'warn' || s === 'danger' || s === 'info') {
    return s;
  }
  if (s.includes('delete') || s.includes('error')) {
    return 'danger';
  }
  if (s.includes('warn')) {
    return 'warn';
  }
  if (s.includes('create') || s.includes('add')) {
    return 'success';
  }
  return 'info';
}

function initialsFromUnknown(actor: unknown, email: unknown): string {
  const name = str(actor);
  if (name.length >= 2) {
    return name.slice(0, 2).toUpperCase();
  }
  const em = str(email);
  if (em.includes('@')) {
    return em[0]!.toUpperCase() + (em[1] ?? '').toUpperCase();
  }
  return '•';
}

export function normalizeAuditLogEntry(raw: unknown): AuditLogEntryDto {
  const r = raw as Record<string, unknown>;
  return {
    id: str(r['id'] ?? r['Id'] ?? `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
    message: str(r['message'] ?? r['Message'] ?? r['description'] ?? r['Description'] ?? ''),
    actorInitials: str(
      r['actorInitials'] ??
        r['ActorInitials'] ??
        initialsFromUnknown(r['actor'] ?? r['Actor'], r['actorEmail'] ?? r['ActorEmail']),
    ).slice(0, 2),
    actorEmail: (r['actorEmail'] ?? r['ActorEmail'] ?? null) as string | null,
    occurredAt: str(r['occurredAt'] ?? r['OccurredAt'] ?? r['createdAt'] ?? r['CreatedAt'] ?? new Date().toISOString()),
    severity: severity(r['severity'] ?? r['Severity'] ?? r['level'] ?? r['Level']),
  };
}

export function normalizeAuditLogList(raw: unknown): AuditLogEntryDto[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeAuditLogEntry);
  }
  if (raw != null && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const inner = o['items'] ?? o['Items'] ?? o['data'] ?? o['Data'];
    if (Array.isArray(inner)) {
      return inner.map(normalizeAuditLogEntry);
    }
  }
  return [];
}
