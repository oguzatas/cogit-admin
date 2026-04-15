import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '@/app/core/api/tokens/api-url.token';
import { normalizeAssignmentResultView, normalizeManualGrade } from '@/app/core/api/mappers/test-review.mapper';
import type {
  AssignmentResultViewDto,
  ManualGradeDto,
} from '@/app/core/api/models/test-review.dto';

/** Admin/TenantStaff context — results viewing and manual grading. */
@Injectable({ providedIn: 'root' })
export class TestReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getResults(assignmentId: string): Observable<AssignmentResultViewDto> {
    return this.http
      .get<unknown>(
        `${this.apiUrl}/api/Assignments/${encodeURIComponent(assignmentId)}/results`,
      )
      .pipe(map((raw) => normalizeAssignmentResultView(raw)));
  }

  submitManualGrade(
    assignmentId: string,
    payload: ManualGradeDto,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/api/Assignments/${encodeURIComponent(assignmentId)}/manual-grade`,
      normalizeManualGrade(payload),
    );
  }
}

