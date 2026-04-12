import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import type {
  ScoringScaleCreateRequestDto,
  ScoringScaleResponseDto,
} from '../models/scoring-scale.dto';

/** `/api/ScoringScales` — SuperAdmin. */
@Injectable({ providedIn: 'root' })
export class ScoringScaleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  create(body: ScoringScaleCreateRequestDto): Observable<ScoringScaleResponseDto> {
    return this.http.post<ScoringScaleResponseDto>(
      `${this.apiUrl}/api/ScoringScales`,
      body,
    );
  }
}
