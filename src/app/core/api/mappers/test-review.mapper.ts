import type {
  AssignmentCalculatedResultDto,
  AssignmentResultViewDto,
  ManualGradeDto,
} from '@/app/core/api/models/test-review.dto';

function str(v: unknown): string {
  if (v == null) {
    return '';
  }
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalizer for results view.
 * Since the endpoint is not in OpenAPI yet, we keep this defensive.
 */
export function normalizeAssignmentResultView(raw: unknown): AssignmentResultViewDto {
  const r = raw as AssignmentResultViewDto & Record<string, unknown>;
  const answersRaw = (r.answers ?? r['Answers']) as unknown;
  const answers = Array.isArray(answersRaw) ? answersRaw : [];
  const resultsRaw = (r.results ?? r['Results']) as unknown;
  const results = Array.isArray(resultsRaw) ? resultsRaw : [];
  return {
    assignmentId: str(r.assignmentId ?? r['AssignmentId']),
    testId: str(r.testId ?? r['TestId']),
    testName: str(r.testName ?? r['TestName']),
    status: str(r.status ?? r['Status']),
    submittedAt: (r.submittedAt ?? r['SubmittedAt'] ?? null) as any,
    answers: answers as any,
    results: results.map((x) => normalizeCalculatedResult(x)),
  };
}

export function normalizeCalculatedResult(raw: unknown): AssignmentCalculatedResultDto {
  const r = raw as AssignmentCalculatedResultDto & Record<string, unknown>;
  return {
    variableKey: str(r.variableKey ?? r['VariableKey']),
    points: num(r.points ?? r['Points']),
  };
}

export function normalizeManualGrade(payload: ManualGradeDto): ManualGradeDto {
  return {
    variableKey: str(payload.variableKey),
    points: num(payload.points),
  };
}

