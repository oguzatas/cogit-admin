import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  AssignmentCreateRequestDto,
  AssignmentCreateResponseDto,
} from '../models/assignment.dto';

/** `/api/Assignments` — TenantStaff / SuperAdmin. */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  create(body: AssignmentCreateRequestDto): Observable<AssignmentCreateResponseDto> {
    return this.http.post<AssignmentCreateResponseDto>(
      `${this.apiUrl}/api/Assignments`,
      body,
    );
  }
}
