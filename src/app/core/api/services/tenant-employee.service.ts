import { HttpClient, HttpParams } from '@angular/common/http';
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

  /**
   * GET `/api/TenantEmployees?tenantId=&departmentId=` — `departmentId` optional
   * when the API lists all people in a tenant.
   */
  list(tenantId: string, departmentId?: string): Observable<TenantEmployeeResponseDto[]> {
    let params = new HttpParams().set('tenantId', tenantId);
    if (departmentId) {
      params = params.set('departmentId', departmentId);
    }
    return this.http.get<TenantEmployeeResponseDto[]>(
      `${this.apiUrl}/api/TenantEmployees`,
      { params },
    );
  }

  create(
    body: TenantEmployeeCreateRequestDto,
  ): Observable<TenantEmployeeResponseDto> {
    return this.http.post<TenantEmployeeResponseDto>(
      `${this.apiUrl}/api/TenantEmployees`,
      body,
    );
  }
}
