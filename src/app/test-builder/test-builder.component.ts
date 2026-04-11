import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FluidModule } from 'primeng/fluid';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { SplitterModule } from 'primeng/splitter';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { Question, QuestionType } from './test-builder.models';
import { TestBuilderStore } from './test-builder.store';

@Component({
  selector: 'app-test-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    FluidModule,
    ToolbarModule,
    ButtonModule,
    RippleModule,
    SplitterModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputNumberModule,
    AccordionModule,
    ConfirmDialogModule,
  ],
  templateUrl: './test-builder.component.html',
  styleUrl: './test-builder.component.scss',
  providers: [ConfirmationService],
})
export class TestBuilderComponent {
  readonly store = inject(TestBuilderStore);
  private readonly confirmation = inject(ConfirmationService);

  readonly questionTypeOptions: { label: string; value: QuestionType }[] = [
    { label: 'Single choice', value: QuestionType.SingleChoice },
    { label: 'Multiple choice', value: QuestionType.MultipleChoice },
    { label: 'Text input', value: QuestionType.TextInput },
    { label: 'Number input', value: QuestionType.NumberInput },
  ];

  /**
   * Target-question options for the currently selected question, derived from
   * {@link TestBuilderStore.availableTargetQuestions} (forward-only by order).
   */
  readonly branchTargetSelectOptions = computed(() => {
    const q = this.store.selectedQuestion();
    if (!q) {
      return [];
    }
    return this.store.availableTargetQuestions(q.id).map((t) => ({
      label: `${t.variableKey} (#${t.orderIndex}) — ${this.snippet(t.text, 42)}`,
      value: t.id,
    }));
  });

  addSingleChoiceQuestion(): void {
    this.store.addQuestion(QuestionType.SingleChoice);
  }

  onQuestionDropped(event: CdkDragDrop<Question[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    this.store.reorderQuestions(event.previousIndex, event.currentIndex);
  }

  questionHasInvalidRule(q: Question): boolean {
    return q.branchingRules.some((r) => r.isInvalid);
  }

  requestDeleteQuestion(questionId: string): void {
    const subject = this.store.questions().find((q) => q.id === questionId);
    const label = subject?.variableKey ?? 'this question';
    const deps = this.store.deleteQuestion(questionId);

    const dependencyLines =
      deps.length === 0
        ? ''
        : '\n\nDependent branching rules (they will be removed):\n' +
          deps
            .map(
              (d) =>
                `• [${d.sourceVariableKey}] (order ${d.sourceOrderIndex}) — condition: ${d.conditionExpression?.trim() || '(empty)'}`,
            )
            .join('\n');

    const message =
      deps.length === 0
        ? `Delete "${label}"? This cannot be undone.`
        : `Delete "${label}"? Other questions have branching rules that jump to this question; those rules will be removed.${dependencyLines}`;

    this.confirmation.confirm({
      header:
        deps.length > 0
          ? 'Delete question — branching impact'
          : 'Delete question',
      message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.store.confirmDeleteQuestion(questionId),
    });
  }

  listCardStyleClass(q: Question): string {
    const selected = this.store.selectedQuestionId() === q.id;
    const invalid = this.questionHasInvalidRule(q);
    const base =
      'cursor-pointer transition-colors transition-duration-150 shadow-1';
    if (selected) {
      return `${base} border-primary border-2 surface-ground`;
    }
    if (invalid) {
      return `${base} surface-border border-1 border-orange-500 surface-card hover:surface-hover`;
    }
    return `${base} surface-border border-1 surface-card hover:surface-hover`;
  }

  snippet(text: string, maxLen: number): string {
    const t = (text ?? '').trim();
    if (!t) {
      return 'No text';
    }
    return t.length <= maxLen ? t : `${t.slice(0, maxLen)}…`;
  }

  onRuleTargetChange(
    questionId: string,
    ruleId: string,
    value: string | null | undefined,
  ): void {
    const normalized =
      value === null || value === undefined || value === ''
        ? null
        : value;
    this.store.updateBranchingRuleTarget(questionId, ruleId, normalized);
  }
}
