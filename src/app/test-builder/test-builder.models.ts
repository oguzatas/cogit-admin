export enum QuestionType {
  SingleChoice = 'SingleChoice',
  MultipleChoice = 'MultipleChoice',
  TextInput = 'TextInput',
  NumberInput = 'NumberInput',
}

export interface TestBuilderDraft {
  title: string;
  questions: Question[];
}

export interface QuestionOption {
  id: string;
  text: string;
  numericValue: number;
  orderIndex: number;
}

export interface BranchingRule {
  id: string;
  sourceQuestionId: string;
  conditionExpression: string;
  /** Set when the rule is complete; `null` while the target is not chosen yet. */
  targetQuestionId: string | null;
  isDefault: boolean;
  /**
   * True when the target is missing, or when reordering places the target at or
   * before the source in flow order (invalid forward jump).
   */
  isInvalid: boolean;
}

/** Branching rule on another question that targets the question being deleted. */
export interface DependentBranchingRuleInfo {
  ruleId: string;
  sourceQuestionId: string;
  sourceVariableKey: string;
  sourceOrderIndex: number;
  conditionExpression: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  orderIndex: number;
  variableKey: string;
  options: QuestionOption[];
  branchingRules: BranchingRule[];
}
