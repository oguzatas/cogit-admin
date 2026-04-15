/** Guest/Employee test execution domain. */

export type ApiId = string;

/** POST `/api/Assignments/access` */
export interface IssueGuestTokenRequestDto {
  accessKey: string;
}

export interface GuestTokenResponseDto {
  accessToken: string;
  expiresInSeconds: number | string;
}

/** GET `/api/Assignments/session` */
export interface AssignmentSessionDto {
  assignmentId: ApiId;
  testId: ApiId;
  testName: string;
  status: string;
  questions: SessionQuestionDto[];
}

export interface SessionQuestionDto {
  id: ApiId;
  text: string;
  questionType: string;
  orderIndex: number | string;
  isRequired: boolean;
  settings: QuestionSettingsDto | null;
  options: SessionOptionDto[];
}

export interface QuestionSettingsDto {
  isRequired?: boolean;
  placeholder?: string | null;
  minValue?: number | string | null;
  maxValue?: number | string | null;
  randomizeOptions?: boolean;
}

export interface SessionOptionDto {
  id: ApiId;
  text: string;
  orderIndex: number | string;
}

/** PUT `/api/Assignments/answers` */
export interface UpsertAssignmentAnswerCommandDto {
  questionId: ApiId;
  selectedOptionIds: ApiId[];
  numberValue?: number | string | null;
  textValue?: string | null;
}

/** POST `/api/Assignments/submit` */
export interface SubmitAssignmentResultDto {
  /** Final status string from backend. */
  status: string;
}

