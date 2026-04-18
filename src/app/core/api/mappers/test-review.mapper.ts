import type {
  AssignmentAnswerViewDto,
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

function normalizeVariableTotals(raw: unknown): Record<string, number> | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k.startsWith('$')) {
      continue;
    }
    out[k] = num(v);
  }
  return Object.keys(out).length ? out : null;
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
    answers: answers.map((x) => normalizeAnswer(x)),
    results: results.map((x) => normalizeCalculatedResult(x)),
    variableTotals: normalizeVariableTotals(r.variableTotals ?? r['VariableTotals']),
  };
}

function normalizeAnswer(raw: unknown): AssignmentAnswerViewDto {
  const r = raw as Record<string, unknown>;
  const idsRaw = (r['selectedOptionIds'] ?? r['SelectedOptionIds']) as unknown;
  const selectedOptionIds = Array.isArray(idsRaw)
    ? idsRaw.map((x) => str(x))
    : [];
  return {
    questionId: str(r['questionId'] ?? r['QuestionId']),
    questionText: str(r['questionText'] ?? r['QuestionText'] ?? ''),
    questionType: str(r['questionType'] ?? r['QuestionType'] ?? ''),
    selectedOptionIds,
    numberValue: (r['numberValue'] ?? r['NumberValue'] ?? null) as any,
    textValue: (r['textValue'] ?? r['TextValue'] ?? null) as any,
    requiresManualGrade: Boolean(r['requiresManualGrade'] ?? r['RequiresManualGrade']),
    userAnswerLabel: (r['userAnswerLabel'] ?? r['UserAnswerLabel'] ?? null) as any,
    pointsAwarded: (r['pointsAwarded'] ?? r['PointsAwarded'] ?? null) as any,
    variableKey: (r['variableKey'] ?? r['VariableKey'] ?? null) as any,
  };
}

export function normalizeCalculatedResult(raw: unknown): AssignmentCalculatedResultDto {
  const r = raw as AssignmentCalculatedResultDto & Record<string, unknown>;
  const pk = str(r['variableKey'] ?? r['VariableKey']);
  const scaleName = str(r['scaleName'] ?? r['ScaleName'] ?? pk);
  const resultTextRaw = str(r['resultText'] ?? r['ResultText'] ?? '');
  const calcRaw =
    r['calculatedScore'] ?? r['CalculatedScore'] ?? r['points'] ?? r['Points'];
  const hasNumeric =
    calcRaw != null &&
    calcRaw !== '' &&
    !(typeof calcRaw === 'string' && calcRaw.trim() === '');
  const pts = hasNumeric ? num(calcRaw) : 0;
  return {
    variableKey: pk,
    points: pts,
    scaleName: scaleName || pk,
    calculatedScore: hasNumeric ? pts : undefined,
    resultText: resultTextRaw || undefined,
  };
}

export function normalizeManualGrade(payload: ManualGradeDto): Record<string, unknown> {
  const body: Record<string, unknown> = {
    points: num(payload.points),
  };
  if (payload.variableKey) {
    body['variableKey'] = str(payload.variableKey);
  }
  if (payload.questionId) {
    body['questionId'] = str(payload.questionId);
  }
  return body;
}

