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
}

/** One computed output (e.g. variableKey -> points). */
export interface AssignmentCalculatedResultDto {
  variableKey: string;
  points: number | string;
}

/** POST `/api/Assignments/{id}/manual-grade` */
export interface ManualGradeDto {
  variableKey: string;
  points: number | string;
}

