import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  normalizeEmployeeAssignmentDto,
  normalizePagedTenantEmployeesResponse,
} from '@/app/core/api/mappers/tenant-employee.mapper';
import { API_URL } from '../tokens/api-url.token';
import type {
  EmployeeAssignmentDto,
  PagedTenantEmployeesResponseDto,
  TenantEmployeeCreateRequestDto,
  TenantEmployeeResponseDto,
  TenantEmployeesListQueryDto,
} from '../models/tenant-employee.dto';

/** `/api/TenantEmployees` — Flow A (SuperAdmin). */
@Injectable({ providedIn: 'root' })
export class TenantEmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  /**
   * GET `/api/TenantEmployees` — paged directory.
   * Backend expects PascalCase `PageNumber` / `PageSize`, plus `tenantId` and optional `departmentId`.
   */
  listPaged(
    tenantId: string,
    query: TenantEmployeesListQueryDto,
  ): Observable<PagedTenantEmployeesResponseDto> {
    let params = new HttpParams()
      .set('PageNumber', String(query.pageNumber))
      .set('PageSize', String(query.pageSize))
      .set('tenantId', tenantId);
    if (query.departmentId) {
      params = params.set('departmentId', query.departmentId);
    }
    const url = `${this.apiUrl}/api/TenantEmployees`;
    return this.http.get<unknown>(url, { params }).pipe(
      map((raw) => normalizePagedTenantEmployeesResponse(raw)),
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

  getAssignments(employeeId: string): Observable<EmployeeAssignmentDto[]> {
    return this.http
      .get<unknown>(
        `${this.apiUrl}/api/TenantEmployees/${encodeURIComponent(employeeId)}/assignments`,
      )
      .pipe(
        map((raw) =>
          Array.isArray(raw) ? raw.map(normalizeEmployeeAssignmentDto) : [],
        ),
      );
  }
}
