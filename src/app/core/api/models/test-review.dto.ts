/** Admin/TenantStaff review domain (results + manual grading). */

export type ApiId = string;

/**
 * GET `/api/Assignments/{id}/results`
 *
 * This endpoint is not present in the provided OpenAPI file, so the shape below
 * follows the brief: assignment details + raw answers + calculated results.
 * Adjust fields once backend schema is finalized.
 */
export interface AssignmentResultViewDto {
  assignmentId: ApiId;
  testId: ApiId;
  testName: string;
  status: string;
  submittedAt?: string | null;
  answers: AssignmentAnswerViewDto[];
  results: AssignmentCalculatedResultDto[];
  /**
   * Raw tallies per scoring variable (e.g. `{ "e": 15, "i": 5 }`) for profile charts.
   */
  variableTotals?: Record<string, number> | null;
}

export interface AssignmentAnswerViewDto {
  questionId: ApiId;
  questionText?: string;
  questionType?: string;
  selectedOptionIds: ApiId[];
  numberValue?: number | string | null;
  textValue?: string | null;
  /** Whether manual grading is required for this answer. */
  requiresManualGrade?: boolean;
  /** Human-readable selected option text(s) when applicable. */
  userAnswerLabel?: string | null;
  /** Points awarded for this question (if provided by API). */
  pointsAwarded?: number | string | null;
  /** NCalc / scoring variable key for manual grade submission. */
  variableKey?: string | null;
}

/** One computed output (e.g. scale / variable → score). */
export interface AssignmentCalculatedResultDto {
  variableKey: string;
  points: number | string;
  /** Display name for charts (falls back to variableKey). */
  scaleName?: string;
  /** Alias for points when API sends calculatedScore. */
  calculatedScore?: number | string;
  /** Final typed outcome when API sends string result (e.g. `"ENTJ"`). */
  resultText?: string | null;
}

/** POST `/api/Assignments/{id}/manual-grade` */
export interface ManualGradeDto {
  variableKey?: string;
  questionId?: ApiId;
  points: number | string;
}

