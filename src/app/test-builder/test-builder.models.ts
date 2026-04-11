export enum QuestionType {
  SingleChoice = 'SingleChoice',
  MultipleChoice = 'MultipleChoice',
  TextInput = 'TextInput',
  NumberInput = 'NumberInput',
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
