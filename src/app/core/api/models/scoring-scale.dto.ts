/** POST /api/ScoringScales */
export interface ScoringScaleCreateRequestDto {
  testId: string;
  name: string;
  formulaExpression: string;
}

export interface ScoringScaleResponseDto {
  id: string;
  testId: string;
  name: string;
  formulaExpression: string;
}
