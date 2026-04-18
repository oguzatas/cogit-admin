import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizePagedAssignmentsResponse } from '@/app/core/api/mappers/assignment.mapper';
import { API_URL } from '../tokens/api-url.token';
import type {
  AssignmentCreateRequestDto,
  AssignmentCreateResponseDto,
  AssignmentListItemResponseDto,
  AssignmentsPagedQueryDto,
  PagedAssignmentsResponseDto,
} from '../models/assignment.dto';

/** `/api/Assignments` — TenantStaff / SuperAdmin. */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listByTenant(tenantId: string): Observable<AssignmentListItemResponseDto[]> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http.get<AssignmentListItemResponseDto[]>(
      `${this.apiUrl}/api/Assignments`,
      { params },
    );
  }

  /**
   * GET `/api/Assignments` — paginated listing (PageNumber, PageSize; optional tenantId).
   */
  listPaged(query: AssignmentsPagedQueryDto): Observable<PagedAssignmentsResponseDto> {
    let params = new HttpParams()
      .set('PageNumber', String(query.pageNumber))
      .set('PageSize', String(query.pageSize));
    if (query.tenantId) {
      params = params.set('tenantId', query.tenantId);
    }
    return this.http
      .get<unknown>(`${this.apiUrl}/api/Assignments`, { params })
      .pipe(map((raw) => normalizePagedAssignmentsResponse(raw)));
  }

  create(body: AssignmentCreateRequestDto): Observable<AssignmentCreateResponseDto> {
    return this.http.post<AssignmentCreateResponseDto>(
      `${this.apiUrl}/api/Assignments`,
      body,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Assignments/${encodeURIComponent(id)}`,
    );
  }
}
