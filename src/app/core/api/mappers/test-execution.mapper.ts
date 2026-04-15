import type {
  AssignmentSessionDto,
  GuestTokenResponseDto,
  SessionOptionDto,
  SessionQuestionDto,
  SubmitAssignmentResultDto,
} from '@/app/core/api/models/test-execution.dto';

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

export function normalizeGuestTokenResponse(raw: unknown): GuestTokenResponseDto {
  const r = raw as GuestTokenResponseDto & Record<string, unknown>;
  return {
    accessToken: str(r.accessToken ?? r['AccessToken']),
    expiresInSeconds: num(r.expiresInSeconds ?? r['ExpiresInSeconds'], 0),
  };
}

export function normalizeSessionOption(raw: unknown): SessionOptionDto {
  const r = raw as SessionOptionDto & Record<string, unknown>;
  return {
    id: str(r.id ?? r['Id']),
    text: str(r.text ?? r['Text']),
    orderIndex: num(r.orderIndex ?? r['OrderIndex']),
  };
}

export function normalizeSessionQuestion(raw: unknown): SessionQuestionDto {
  const r = raw as SessionQuestionDto & Record<string, unknown>;
  const optsRaw = (r.options ?? r['Options']) as unknown;
  const opts = Array.isArray(optsRaw) ? optsRaw : [];
  return {
    id: str(r.id ?? r['Id']),
    text: str(r.text ?? r['Text']),
    questionType: str(r.questionType ?? r['QuestionType']),
    orderIndex: num(r.orderIndex ?? r['OrderIndex']),
    isRequired: Boolean(r.isRequired ?? r['IsRequired']),
    settings: (r.settings ?? r['Settings'] ?? null) as any,
    options: opts.map(normalizeSessionOption),
  };
}

export function normalizeAssignmentSession(raw: unknown): AssignmentSessionDto {
  const r = raw as AssignmentSessionDto & Record<string, unknown>;
  const qsRaw = (r.questions ?? r['Questions']) as unknown;
  const qs = Array.isArray(qsRaw) ? qsRaw : [];
  return {
    assignmentId: str(r.assignmentId ?? r['AssignmentId']),
    testId: str(r.testId ?? r['TestId']),
    testName: str(r.testName ?? r['TestName']),
    status: str(r.status ?? r['Status']),
    questions: qs.map(normalizeSessionQuestion),
  };
}

export function normalizeSubmitResult(raw: unknown): SubmitAssignmentResultDto {
  const r = raw as SubmitAssignmentResultDto & Record<string, unknown>;
  return {
    status: str(r.status ?? r['Status']),
  };
}

