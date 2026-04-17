import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { API_URL } from '@/app/core/api/tokens/api-url.token';
import {
  normalizeQuestionWithOptionsDto,
  normalizeScoringScaleDto,
  normalizeTestVariableDto,
} from '@/app/core/api/mappers/test-blueprint.mapper';
import type {
  CreateQuestionCommand,
  CreateScoringScaleCommand,
  CreateTestVariableCommand,
  SyncTestBlueprintCommand,
  UpdateQuestionCommand,
  UpdateScoringScaleCommand,
  UpdateTestVariableCommand,
} from '@/app/core/api/models/test-blueprint.dto';
import type {
  BlueprintQuestion,
  ScoringMetric,
  TestVariable,
} from '@/app/core/api/models/test-blueprint.models';

function unwrapArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw != null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const inner = obj['$values'] ?? obj['items'] ?? obj['Items'] ?? obj['value'] ?? obj['Value'];
    if (Array.isArray(inner)) {
      return inner;
    }
  }
  return [];
}

/**
 * Admin/TenantStaff context — manages the test blueprint (variables, metrics, questions).
 */
@Injectable({ providedIn: 'root' })
export class TestBlueprintService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getVariables(testId: string): Observable<TestVariable[]> {
    return this.http
      .get<unknown>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(testId)}/variables`,
      )
      .pipe(map((raw) => unwrapArray(raw).map(normalizeTestVariableDto)));
  }

  createVariable(
    testId: string,
    payload: CreateTestVariableCommand,
  ): Observable<TestVariable> {
    return this.http
      .post<unknown>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(testId)}/variables`,
      payload,
      )
      .pipe(map((raw) => normalizeTestVariableDto(raw)));
  }

  updateVariable(id: string, payload: UpdateTestVariableCommand): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/api/Variables/${encodeURIComponent(id)}`,
      payload,
    );
  }

  deleteVariable(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Variables/${encodeURIComponent(id)}`,
    );
  }

  getMetrics(testId: string): Observable<ScoringMetric[]> {
    return this.http
      .get<unknown>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(testId)}/metrics`,
      )
      .pipe(map((raw) => unwrapArray(raw).map(normalizeScoringScaleDto)));
  }

  createMetric(
    testId: string,
    payload: CreateScoringScaleCommand,
  ): Observable<ScoringMetric> {
    return this.http
      .post<unknown>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(testId)}/metrics`,
      payload,
      )
      .pipe(map((raw) => normalizeScoringScaleDto(raw)));
  }

  updateMetric(id: string, payload: UpdateScoringScaleCommand): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/api/Metrics/${encodeURIComponent(id)}`,
      payload,
    );
  }

  deleteMetric(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Metrics/${encodeURIComponent(id)}`,
    );
  }

  getQuestions(testId: string): Observable<BlueprintQuestion[]> {
    return this.http
      .get<unknown>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(testId)}/questions`,
      )
      .pipe(map((raw) => unwrapArray(raw).map(normalizeQuestionWithOptionsDto)));
  }

  createQuestion(
    testId: string,
    payload: CreateQuestionCommand,
  ): Observable<BlueprintQuestion> {
    return this.http
      .post<unknown>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(testId)}/questions`,
      payload,
      )
      .pipe(map((raw) => normalizeQuestionWithOptionsDto(raw)));
  }

  updateQuestion(id: string, payload: UpdateQuestionCommand): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/api/Questions/${encodeURIComponent(id)}`,
      payload,
    );
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Questions/${encodeURIComponent(id)}`,
    );
  }

  syncBlueprint(testId: string, payload: SyncTestBlueprintCommand): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(testId)}/blueprint-sync`,
      payload,
    );
  }
}

