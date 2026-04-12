import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  TenantEmployeeCreateRequestDto,
  TenantEmployeeResponseDto,
} from '../models/tenant-employee.dto';

/** `/api/TenantEmployees` — Flow A (SuperAdmin). */
@Injectable({ providedIn: 'root' })
export class TenantEmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  create(
    body: TenantEmployeeCreateRequestDto,
  ): Observable<TenantEmployeeResponseDto> {
    return this.http.post<TenantEmployeeResponseDto>(
      `${this.apiUrl}/api/TenantEmployees`,
      body,
    );
  }
}
