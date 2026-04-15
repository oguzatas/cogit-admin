import type {
  OptionPointDto,
  OptionWithPointsDto,
  QuestionWithOptionsDto,
  ScoringScaleDto,
  TestVariableDto,
} from '@/app/core/api/models/test-blueprint.dto';
import type {
  BlueprintQuestion,
  OptionPoint,
  QuestionOption,
  ScoringMetric,
  TestVariable,
} from '@/app/core/api/models/test-blueprint.models';

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

export function normalizeTestVariableDto(raw: unknown): TestVariable {
  const r = raw as unknown as TestVariableDto & Record<string, unknown>;
  return {
    id: str(r.id ?? r['Id']),
    testId: str(r.testId ?? r['TestId']),
    name: str(r.name ?? r['Name']),
    key: str(r.key ?? r['Key']),
    defaultValue: num(r.defaultValue ?? r['DefaultValue']),
  };
}

export function normalizeScoringScaleDto(raw: unknown): ScoringMetric {
  const r = raw as unknown as ScoringScaleDto & Record<string, unknown>;
  return {
    id: str(r.id ?? r['Id']),
    testId: str(r.testId ?? r['TestId']),
    name: str(r.name ?? r['Name']),
    key: str((r as any).key ?? r['Key']),
    formulaExpression: str(r.formulaExpression ?? r['FormulaExpression']),
  };
}

export function normalizeOptionPointDto(raw: unknown): OptionPoint {
  const r = raw as unknown as OptionPointDto & Record<string, unknown>;
  return {
    id: str(r.id ?? r['Id']),
    testVariableId: str(r.testVariableId ?? r['TestVariableId']),
    variableKey: str(r.variableKey ?? r['VariableKey']),
    variableName: str(r.variableName ?? r['VariableName']),
    points: num(r.points ?? r['Points']),
  };
}

export function normalizeOptionWithPointsDto(raw: unknown): QuestionOption {
  const r = raw as unknown as OptionWithPointsDto & Record<string, unknown>;
  const ptsRaw = (r.optionPoints ?? r['OptionPoints']) as unknown;
  const pts = Array.isArray(ptsRaw) ? ptsRaw : [];
  const numericRaw = r.numericValue ?? r['NumericValue'];
  const numericValue =
    numericRaw === null || numericRaw === undefined ? null : num(numericRaw);
  return {
    id: str(r.id ?? r['Id']),
    text: str(r.text ?? r['Text']),
    numericValue,
    orderIndex: num(r.orderIndex ?? r['OrderIndex']),
    optionPoints: pts.map(normalizeOptionPointDto),
  };
}

export function normalizeQuestionWithOptionsDto(raw: unknown): BlueprintQuestion {
  const r = raw as unknown as QuestionWithOptionsDto & Record<string, unknown>;
  const optsRaw = (r.options ?? r['Options']) as unknown;
  const opts = Array.isArray(optsRaw) ? optsRaw : [];
  return {
    id: str(r.id ?? r['Id']),
    testId: str(r.testId ?? r['TestId']),
    text: str(r.text ?? r['Text']),
    questionType: (r.questionType ?? r['QuestionType']) as unknown as
      | string
      | number,
    orderIndex: num(r.orderIndex ?? r['OrderIndex']),
    variableKey: str(r.variableKey ?? r['VariableKey']),
    settings: (r.settings ?? r['Settings'] ?? null) as any,
    options: opts.map(normalizeOptionWithPointsDto),
  };
}

