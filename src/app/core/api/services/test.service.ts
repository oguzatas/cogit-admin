import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type { TestListItemResponseDto } from '../models/test.dto';

/** `/api/Tests` — SuperAdmin / staff (read). */
@Injectable({ providedIn: 'root' })
export class TestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(): Observable<TestListItemResponseDto[]> {
    return this.http.get<TestListItemResponseDto[]>(`${this.apiUrl}/api/Tests`);
  }
}
