import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  InviteCodeCreateRequestDto,
  InviteCodeListItemResponseDto,
  InviteCodeRedeemRequestDto,
  InviteCodeRedeemResponseDto,
} from '../models/invite-code.dto';

/** `/api/InviteCodes` — SuperAdmin; redeem is public. */
@Injectable({ providedIn: 'root' })
export class InviteCodeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(
    tenantId: string,
    departmentId: string,
  ): Observable<InviteCodeListItemResponseDto[]> {
    const params = new HttpParams()
      .set('tenantId', tenantId)
      .set('departmentId', departmentId);
    return this.http.get<InviteCodeListItemResponseDto[]>(
      `${this.apiUrl}/api/InviteCodes`,
      { params },
    );
  }

  create(body: InviteCodeCreateRequestDto): Observable<InviteCodeListItemResponseDto> {
    return this.http.post<InviteCodeListItemResponseDto>(
      `${this.apiUrl}/api/InviteCodes`,
      body,
    );
  }

  revoke(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/InviteCodes/${encodeURIComponent(id)}/revoke`,
    );
  }

  redeem(body: InviteCodeRedeemRequestDto): Observable<InviteCodeRedeemResponseDto> {
    return this.http.post<InviteCodeRedeemResponseDto>(
      `${this.apiUrl}/api/InviteCodes/redeem`,
      body,
    );
  }
}
