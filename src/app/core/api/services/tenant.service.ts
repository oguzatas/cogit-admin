import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  TenantCreateRequestDto,
  TenantResponseDto,
  TenantUpdateRequestDto,
} from '../models/tenant.dto';

/** `/api/Tenants` — SuperAdmin. */
@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(): Observable<TenantResponseDto[]> {
    return this.http.get<TenantResponseDto[]>(`${this.apiUrl}/api/Tenants`);
  }

  getById(id: string): Observable<TenantResponseDto> {
    return this.http.get<TenantResponseDto>(
      `${this.apiUrl}/api/Tenants/${encodeURIComponent(id)}`,
    );
  }

  create(body: TenantCreateRequestDto): Observable<TenantResponseDto> {
    return this.http.post<TenantResponseDto>(`${this.apiUrl}/api/Tenants`, body);
  }

  update(id: string, body: TenantUpdateRequestDto): Observable<TenantResponseDto> {
    return this.http.put<TenantResponseDto>(
      `${this.apiUrl}/api/Tenants/${encodeURIComponent(id)}`,
      body,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Tenants/${encodeURIComponent(id)}`,
    );
  }
}
