import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { normalizeAuditLogList } from '@/app/core/api/mappers/audit-log.mapper';
import { API_URL } from '../tokens/api-url.token';
import type { AuditLogEntryDto } from '../models/audit-log.dto';

/**
 * GET `/api/AuditLogs` — optional; returns an empty list when the route is missing or errors.
 */
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listRecent(take = 20): Observable<AuditLogEntryDto[]> {
    const params = new HttpParams().set('take', String(take));
    return this.http.get<unknown>(`${this.apiUrl}/api/AuditLogs`, { params }).pipe(
      map((raw) => normalizeAuditLogList(raw)),
      catchError(() => of([])),
    );
  }
}
