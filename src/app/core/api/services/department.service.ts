import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  DepartmentCreateRequestDto,
  DepartmentResponseDto,
  DepartmentUpdateRequestDto,
} from '../models/department.dto';

/** `/api/Departments` — SuperAdmin / TenantStaff (read). */
@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(tenantId: string): Observable<DepartmentResponseDto[]> {
    const params = new HttpParams().set('tenantId', tenantId);
    return this.http.get<DepartmentResponseDto[]>(`${this.apiUrl}/api/Departments`, {
      params,
    });
  }

  getById(id: string): Observable<DepartmentResponseDto> {
    return this.http.get<DepartmentResponseDto>(
      `${this.apiUrl}/api/Departments/${encodeURIComponent(id)}`,
    );
  }

  create(body: DepartmentCreateRequestDto): Observable<DepartmentResponseDto> {
    return this.http.post<DepartmentResponseDto>(
      `${this.apiUrl}/api/Departments`,
      body,
    );
  }

  update(id: string, body: DepartmentUpdateRequestDto): Observable<DepartmentResponseDto> {
    return this.http.put<DepartmentResponseDto>(
      `${this.apiUrl}/api/Departments/${encodeURIComponent(id)}`,
      body,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/Departments/${encodeURIComponent(id)}`,
    );
  }
}
