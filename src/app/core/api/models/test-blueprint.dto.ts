/**
 * Test blueprint domain (Admin/TenantStaff).
 *
 * Notes:
 * - Backend uses int32 ids but frequently returns them as `integer | string`.
 *   In the admin UI we normalize to `string` for stable keys.
 * - Some enum-like fields are represented inconsistently in OpenAPI (integer in commands, string in DTOs).
 *   We keep request payload types strict to the documented command shapes.
 */

export type ApiId = string;

/** `/api/Tests/{id}/variables` */
export interface TestVariableDto {
  id: ApiId;
  testId: ApiId;
  name: string;
  /** NCalc identifier (unique per test). */
  key: string;
  defaultValue: number | string;
}

export interface CreateTestVariableCommand {
  testId?: ApiId;
  name: string;
  key: string;
  defaultValue: number | string;
}

/** Update endpoint is `/api/Variables/{id}` per backend contract. */
export interface UpdateTestVariableCommand {
  id?: ApiId;
  name: string;
  key: string;
  defaultValue: number | string;
}

/** `/api/Tests/{id}/metrics` (ScoringScales) */
export interface ScoringScaleDto {
  id: ApiId;
  testId: ApiId;
  name: string;
  /** Optional key/shortcode when supported by backend. */
  key?: string;
  formulaExpression: string;
}

export interface CreateScoringScaleCommand {
  testId?: ApiId;
  name: string;
  /** Optional key/shortcode when supported by backend. */
  key?: string;
  formulaExpression: string;
}

/** Update endpoint is `/api/Metrics/{id}` per backend contract. */
export interface UpdateScoringScaleCommand {
  id?: ApiId;
  name: string;
  /** Optional key/shortcode when supported by backend. */
  key?: string;
  formulaExpression: string;
}

/**
 * QuestionType in OpenAPI is an integer enum, but question DTOs return `string`.
 * Keep commands typed as `number` to match documented request shapes.
 */
export type QuestionType =
  | number
  | 'SingleChoice'
  | 'MultipleChoice'
  | 'TextInput'
  | 'NumberInput';

export interface QuestionSettingsDto {
  isRequired?: boolean;
  placeholder?: string | null;
  minValue?: number | string | null;
  maxValue?: number | string | null;
  randomizeOptions?: boolean;
}

export interface OptionPointDto {
  id: ApiId;
  testVariableId: ApiId;
  variableKey: string;
  variableName: string;
  points: number | string;
}

export interface OptionWithPointsDto {
  id: ApiId;
  text: string;
  numericValue: number | string | null;
  orderIndex: number | string;
  optionPoints: OptionPointDto[];
}

export interface QuestionWithOptionsDto {
  id: ApiId;
  testId: ApiId;
  text: string;
  /** See note on {@link QuestionType}. */
  questionType: string;
  orderIndex: number | string;
  variableKey: string;
  settings: QuestionSettingsDto | null;
  options: OptionWithPointsDto[];
}

/** Aggregate root payload for POST `/api/Tests/{id}/questions`. */
export interface CreateOptionPointDto {
  testVariableId: ApiId;
  points: number | string;
}

export interface CreateOptionDto {
  text: string;
  numericValue: number | string | null;
  orderIndex: number | string;
  optionPoints: CreateOptionPointDto[];
}

export interface CreateQuestionCommand {
  testId?: ApiId;
  text: string;
  questionType: QuestionType;
  orderIndex: number | string;
  variableKey: string;
  settings: QuestionSettingsDto | null;
  options: CreateOptionDto[];
}

/** Aggregate root payload for PUT `/api/Questions/{id}` (3-way merge). */
export interface UpdateOptionPointDto extends CreateOptionPointDto {
  /** Required when updating an existing option-point mapping. */
  id?: ApiId;
}

export interface UpdateOptionDto extends Omit<CreateOptionDto, 'optionPoints'> {
  /** Required when updating an existing option. */
  id?: ApiId;
  optionPoints: UpdateOptionPointDto[];
}

/** PUT `/api/Questions/{id}` (aggregate root update). */
export interface UpdateQuestionCommand {
  id?: ApiId;
  text: string;
  questionType: QuestionType;
  orderIndex: number | string;
  variableKey: string;
  settings: QuestionSettingsDto | null;
  options: UpdateOptionDto[];
}

