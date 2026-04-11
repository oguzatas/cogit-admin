import { moveItemInArray } from '@angular/cdk/drag-drop';
import { computed, Injectable, signal } from '@angular/core';
import {
  BranchingRule,
  DependentBranchingRuleInfo,
  Question,
  QuestionOption,
  QuestionType,
} from './test-builder.models';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function recomputeRuleInvalidity(
  questions: Question[],
  rule: BranchingRule,
): BranchingRule {
  if (!rule.targetQuestionId) {
    return { ...rule, isInvalid: false };
  }
  const source = questions.find((q) => q.id === rule.sourceQuestionId);
  const target = questions.find((q) => q.id === rule.targetQuestionId);
  if (!source || !target) {
    return { ...rule, isInvalid: true };
  }
  const invalid = target.orderIndex <= source.orderIndex;
  return { ...rule, isInvalid: invalid };
}

function withRecomputedBranchingFlags(questions: Question[]): Question[] {
  return questions.map((q) => ({
    ...q,
    branchingRules: q.branchingRules.map((rule) =>
      recomputeRuleInvalidity(questions, rule),
    ),
  }));
}

@Injectable({ providedIn: 'root' })
export class TestBuilderStore {
  readonly testTitle = signal('Untitled assessment');
  readonly questions = signal<Question[]>([]);
  readonly selectedQuestionId = signal<string | null>(null);

  updateTestTitle(title: string): void {
    this.testTitle.set(title);
  }

  readonly selectedQuestion = computed(() => {
    const id = this.selectedQuestionId();
    if (!id) {
      return null;
    }
    return this.questions().find((q) => q.id === id) ?? null;
  });

  readonly totalQuestions = computed(() => this.questions().length);

  /**
   * Valid branch targets for `sourceQuestionId`: questions that appear strictly
   * after the source in flow order (`orderIndex`), preventing backward jumps and
   * trivial self-loops on the same ordinal position.
   */
  availableTargetQuestions(sourceQuestionId: string): Question[] {
    const list = this.questions();
    const source = list.find((q) => q.id === sourceQuestionId);
    if (!source) {
      return [];
    }
    return list
      .filter((q) => q.orderIndex > source.orderIndex)
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  addQuestion(type: QuestionType): void {
    this.questions.update((qs) => {
      const orderIndex = qs.length;
      const questionNumber = qs.length + 1;
      const question: Question = {
        id: createId(),
        text: '',
        type,
        orderIndex,
        variableKey: `Q${questionNumber}`,
        options: [],
        branchingRules: [],
      };
      return [...qs, question];
    });
  }

  selectQuestion(id: string): void {
    this.selectedQuestionId.set(id);
  }

  updateQuestionText(id: string, text: string): void {
    this.questions.update((qs) =>
      qs.map((q) => (q.id === id ? { ...q, text } : q)),
    );
  }

  updateQuestionVariableKey(id: string, variableKey: string): void {
    this.questions.update((qs) =>
      qs.map((q) => (q.id === id ? { ...q, variableKey } : q)),
    );
  }

  updateQuestionType(id: string, type: QuestionType): void {
    this.questions.update((qs) =>
      qs.map((q) => (q.id === id ? { ...q, type } : q)),
    );
  }

  addOption(questionId: string): void {
    this.questions.update((qs) =>
      qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        const nextIndex = q.options.length;
        const option: QuestionOption = {
          id: createId(),
          text: '',
          numericValue: 0,
          orderIndex: nextIndex,
        };
        return { ...q, options: [...q.options, option] };
      }),
    );
  }

  removeOption(questionId: string, optionId: string): void {
    this.questions.update((qs) =>
      qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        const options = q.options
          .filter((o) => o.id !== optionId)
          .map((o, index) => ({ ...o, orderIndex: index }));
        return { ...q, options };
      }),
    );
  }

  updateOptionText(questionId: string, optionId: string, text: string): void {
    this.questions.update((qs) =>
      qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        return {
          ...q,
          options: q.options.map((o) =>
            o.id === optionId ? { ...o, text } : o,
          ),
        };
      }),
    );
  }

  updateOptionNumericValue(
    questionId: string,
    optionId: string,
    numericValue: number,
  ): void {
    this.questions.update((qs) =>
      qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        return {
          ...q,
          options: q.options.map((o) =>
            o.id === optionId ? { ...o, numericValue } : o,
          ),
        };
      }),
    );
  }

  addBranchingRule(questionId: string): void {
    this.questions.update((qs) => {
      const next = qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        const cleared = q.branchingRules.map((r) => ({ ...r, isDefault: false }));
        const rule: BranchingRule = {
          id: createId(),
          sourceQuestionId: questionId,
          conditionExpression: '',
          targetQuestionId: null,
          isDefault: true,
          isInvalid: false,
        };
        return { ...q, branchingRules: [...cleared, rule] };
      });
      return withRecomputedBranchingFlags(next);
    });
  }

  updateBranchingRuleCondition(
    questionId: string,
    ruleId: string,
    conditionExpression: string,
  ): void {
    this.questions.update((qs) =>
      qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        return {
          ...q,
          branchingRules: q.branchingRules.map((r) =>
            r.id === ruleId ? { ...r, conditionExpression } : r,
          ),
        };
      }),
    );
  }

  updateBranchingRuleTarget(
    questionId: string,
    ruleId: string,
    targetQuestionId: string | null,
  ): void {
    this.questions.update((qs) => {
      const next = qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        return {
          ...q,
          branchingRules: q.branchingRules.map((r) =>
            r.id === ruleId ? { ...r, targetQuestionId } : r,
          ),
        };
      });
      return withRecomputedBranchingFlags(next);
    });
  }

  removeBranchingRule(questionId: string, ruleId: string): void {
    this.questions.update((qs) =>
      qs.map((q) => {
        if (q.id !== questionId) {
          return q;
        }
        return {
          ...q,
          branchingRules: q.branchingRules.filter((r) => r.id !== ruleId),
        };
      }),
    );
  }

  /**
   * Reorders questions in the master list. After moving, all branching rules are
   * scanned; rules whose target is not strictly after the source are marked
   * `isInvalid: true`.
   */
  reorderQuestions(fromIndex: number, toIndex: number): void {
    this.questions.update((qs) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= qs.length ||
        toIndex >= qs.length
      ) {
        return qs;
      }
      if (fromIndex === toIndex) {
        return qs;
      }
      const copy = [...qs];
      moveItemInArray(copy, fromIndex, toIndex);
      const reindexed = copy.map((q, index) => ({ ...q, orderIndex: index }));
      return withRecomputedBranchingFlags(reindexed);
    });
  }

  /**
   * Scans branching rules on other questions that jump to `questionId`.
   * Does not mutate state — use {@link confirmDeleteQuestion} to apply deletion.
   */
  deleteQuestion(questionId: string): DependentBranchingRuleInfo[] {
    const qs = this.questions();
    const out: DependentBranchingRuleInfo[] = [];
    for (const q of qs) {
      if (q.id === questionId) {
        continue;
      }
      for (const r of q.branchingRules) {
        if (r.targetQuestionId === questionId) {
          out.push({
            ruleId: r.id,
            sourceQuestionId: q.id,
            sourceVariableKey: q.variableKey,
            sourceOrderIndex: q.orderIndex,
            conditionExpression: r.conditionExpression,
          });
        }
      }
    }
    return out;
  }

  /**
   * Removes the question, strips branching rules that targeted it, reindexes
   * order, clears selection when needed, and recomputes `isInvalid` flags.
   */
  confirmDeleteQuestion(questionId: string): void {
    this.questions.update((qs) => {
      const filtered = qs.filter((q) => q.id !== questionId);
      const cleaned = filtered.map((q) => ({
        ...q,
        branchingRules: q.branchingRules.filter(
          (r) => r.targetQuestionId !== questionId,
        ),
      }));
      const reindexed = cleaned.map((q, index) => ({ ...q, orderIndex: index }));
      return withRecomputedBranchingFlags(reindexed);
    });
    this.selectedQuestionId.update((id) =>
      id === questionId ? null : id,
    );
  }
}
