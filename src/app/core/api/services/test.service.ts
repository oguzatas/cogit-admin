import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  TestCreateRequestDto,
  TestListItemResponseDto,
  TestResponseDto,
  TestUpdateRequestDto,
} from '../models/test.dto';

/** `/api/Tests` — SuperAdmin / staff (read). */
@Injectable({ providedIn: 'root' })
export class TestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(): Observable<TestListItemResponseDto[]> {
    return this.http.get<TestListItemResponseDto[]>(`${this.apiUrl}/api/Tests`);
  }

  getById(id: string): Observable<TestResponseDto> {
    return this.http.get<TestResponseDto>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(id)}`,
    );
  }

  create(body: TestCreateRequestDto): Observable<TestResponseDto> {
    return this.http.post<TestResponseDto>(`${this.apiUrl}/api/Tests`, body);
  }

  update(id: string, body: TestUpdateRequestDto): Observable<TestResponseDto> {
    return this.http.put<TestResponseDto>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(id)}`,
      body,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Tests/${encodeURIComponent(id)}`,
    );
  }
}
