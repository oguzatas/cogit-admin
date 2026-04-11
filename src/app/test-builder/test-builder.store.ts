import { computed, Injectable, signal } from '@angular/core';
import {
  BranchingRule,
  Question,
  QuestionOption,
  QuestionType,
} from './test-builder.models';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

@Injectable({ providedIn: 'root' })
export class TestBuilderStore {
  readonly questions = signal<Question[]>([]);
  readonly selectedQuestionId = signal<string | null>(null);

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
   *
   * Call sites that read this inside another `computed`/`effect` will stay
   * reactive to `questions` updates because this reads `this.questions()`.
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

  addBranchingRule(questionId: string): void {
    this.questions.update((qs) =>
      qs.map((q) => {
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
        };
        return { ...q, branchingRules: [...cleared, rule] };
      }),
    );
  }

  reorderQuestions(currentIndex: number, newIndex: number): void {
    this.questions.update((qs) => {
      if (
        currentIndex < 0 ||
        newIndex < 0 ||
        currentIndex >= qs.length ||
        newIndex >= qs.length
      ) {
        return qs;
      }
      const copy = [...qs];
      const [moved] = copy.splice(currentIndex, 1);
      copy.splice(newIndex, 0, moved);
      return copy.map((q, index) => ({ ...q, orderIndex: index }));
    });
  }
}
