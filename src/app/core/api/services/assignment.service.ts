import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  AssignmentCreateRequestDto,
  AssignmentCreateResponseDto,
  AssignmentListItemResponseDto,
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
