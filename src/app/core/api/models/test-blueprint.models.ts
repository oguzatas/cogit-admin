import type { QuestionSettingsDto, QuestionType } from './test-blueprint.dto';

export interface TestVariable {
  id: string;
  testId: string;
  name: string;
  key: string;
  defaultValue: number;
}

export interface ScoringMetric {
  id: string;
  testId: string;
  name: string;
  key?: string;
  formulaExpression: string;
}

export interface OptionPoint {
  id: string;
  testVariableId: string;
  variableKey: string;
  variableName: string;
  points: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  numericValue: number | null;
  orderIndex: number;
  optionPoints: OptionPoint[];
}

export interface BlueprintQuestion {
  id: string;
  testId: string;
  text: string;
  /** Enum in requests; backend may return strings here in list DTOs. */
  questionType: QuestionType | string;
  orderIndex: number;
  variableKey: string;
  settings: QuestionSettingsDto | null;
  options: QuestionOption[];
}

