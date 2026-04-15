import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FluidModule } from 'primeng/fluid';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SplitterModule } from 'primeng/splitter';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { QuestionType } from './test-builder.models';
import { TestBlueprintStore } from '@/app/tests/blueprint/test-blueprint.store';
import { TestScoringSettingsComponent } from './test-scoring-settings/test-scoring-settings.component';
import type { BlueprintQuestion } from '@/app/core/api/models/test-blueprint.models';
import type {
  CreateQuestionCommand,
  CreateOptionDto,
  CreateOptionPointDto,
  UpdateQuestionCommand,
  UpdateOptionDto,
  UpdateOptionPointDto,
} from '@/app/core/api/models/test-blueprint.dto';

@Component({
  selector: 'app-test-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FluidModule,
    ToolbarModule,
    ButtonModule,
    SplitterModule,
    CardModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputNumberModule,
    ConfirmDialogModule,
    TestScoringSettingsComponent,
  ],
  templateUrl: './test-builder.component.html',
  styleUrl: './test-builder.component.scss',
  providers: [ConfirmationService],
})
export class TestBuilderComponent {
  testId = input<string | null>(null);

  readonly blueprint = inject(TestBlueprintStore);
  private readonly confirmation = inject(ConfirmationService);

  readonly questionTypeOptions: { label: string; value: QuestionType }[] = [
    { label: 'Single choice', value: QuestionType.SingleChoice },
    { label: 'Multiple choice', value: QuestionType.MultipleChoice },
    { label: 'Text input', value: QuestionType.TextInput },
    { label: 'Number input', value: QuestionType.NumberInput },
  ];

  readonly questionDraft = signal<
    (CreateQuestionCommand & {
      id?: string;
      options: Array<
        CreateOptionDto & {
          id?: string;
          optionPoints: Array<CreateOptionPointDto & { id?: string }>;
        }
      >;
    }) | null
  >(null);

  readonly selectedQuestion = computed(() => this.blueprint.selectedQuestion());

  readonly testVariables = computed(() => this.blueprint.variables());

  readonly variableSelectOptions = computed(() =>
    this.testVariables().map((v) => ({
      label: `${v.key} — ${v.name}`,
      value: v.id,
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const tid = this.testId();
      if (!tid) {
        untracked(() => {
          this.blueprint.setTestId(null);
          this.questionDraft.set(null);
        });
        return;
      }
      const sub = this.blueprint.hydrate$(tid).subscribe({
        next: () => {
          const selected = this.blueprint.selectedQuestion();
          this.questionDraft.set(selected ? draftFromBlueprintQuestion(selected) : null);
        },
        error: () => {},
      });
      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      const q = this.selectedQuestion();
      untracked(() => {
        this.questionDraft.set(q ? draftFromBlueprintQuestion(q) : null);
      });
    });
  }

  selectQuestion(id: string): void {
    this.blueprint.selectedQuestionId.set(id);
  }

  startNewQuestion(type: QuestionType): void {
    const tid = this.testId();
    if (!tid) {
      return;
    }
    const nextOrder = this.blueprint.questions().length;
    const variableKey = `Q${nextOrder + 1}`;
    this.blueprint.selectedQuestionId.set(null);
    this.questionDraft.set({
      testId: tid,
      text: '',
      questionType: type,
      orderIndex: nextOrder,
      variableKey,
      settings: { isRequired: true },
      options: [],
    });
  }

  addOption(): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    const nextIndex = cur.options.length;
    const next: CreateOptionDto = {
      text: '',
      numericValue: null,
      orderIndex: nextIndex,
      optionPoints: [],
    };
    this.questionDraft.set({ ...cur, options: [...cur.options, next] });
  }

  removeOption(index: number): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    const next = cur.options
      .filter((_, i) => i !== index)
      .map((o, i) => ({ ...o, orderIndex: i }));
    this.questionDraft.set({ ...cur, options: next });
  }

  updateOptionText(index: number, text: string): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    const options = cur.options.map((o, i) => (i === index ? { ...o, text } : o));
    this.questionDraft.set({ ...cur, options });
  }

  updateOptionNumericValue(index: number, numericValue: number | null): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    const options = cur.options.map((o, i) =>
      i === index ? { ...o, numericValue } : o,
    );
    this.questionDraft.set({ ...cur, options });
  }

  addScoringRule(optionIndex: number): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    const options = cur.options.map((o, i) => {
      if (i !== optionIndex) {
        return o;
      }
      const rule: CreateOptionPointDto = {
        testVariableId: '',
        points: 0,
      };
      return { ...o, optionPoints: [...(o.optionPoints ?? []), rule] };
    });
    this.questionDraft.set({ ...cur, options });
  }

  updateScoringRule(
    optionIndex: number,
    ruleIndex: number,
    patch: Partial<CreateOptionPointDto>,
  ): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    const options = cur.options.map((o, i) => {
      if (i !== optionIndex) {
        return o;
      }
      const pts = (o.optionPoints ?? []).map((p, pi) =>
        pi === ruleIndex ? { ...p, ...patch } : p,
      );
      return { ...o, optionPoints: pts };
    });
    this.questionDraft.set({ ...cur, options });
  }

  removeScoringRule(optionIndex: number, ruleIndex: number): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    const options = cur.options.map((o, i) => {
      if (i !== optionIndex) {
        return o;
      }
      const pts = (o.optionPoints ?? []).filter((_, pi) => pi !== ruleIndex);
      return { ...o, optionPoints: pts };
    });
    this.questionDraft.set({ ...cur, options });
  }

  patchDraft(patch: Partial<CreateQuestionCommand>): void {
    const cur = this.questionDraft();
    if (!cur) {
      return;
    }
    this.questionDraft.set({ ...cur, ...patch });
  }

  saveQuestion(): void {
    const tid = this.testId();
    const draft = this.questionDraft();
    if (!tid || !draft) {
      return;
    }
    const text = (draft.text ?? '').trim();
    if (!text) {
      return;
    }
    const qt = String(draft.questionType ?? '');
    const needsKey = qt === 'TextInput' || qt === 'NumberInput';
    const key = (draft.variableKey ?? '').trim();
    const effectiveKey = needsKey
      ? key
      : key || `Q${Number(draft.orderIndex ?? 0) + 1}`;
    if (needsKey && !effectiveKey) {
      return;
    }
    for (const opt of draft.options ?? []) {
      for (const r of opt.optionPoints ?? []) {
        if (!r.testVariableId) {
          return;
        }
      }
    }

    if (!draft.id) {
      this.blueprint
        .createQuestion$({ ...draft, variableKey: effectiveKey })
        .subscribe({ error: () => {} });
      return;
    }
    const update: UpdateQuestionCommand = {
      id: draft.id,
      text: draft.text,
      questionType: draft.questionType,
      orderIndex: draft.orderIndex,
      variableKey: effectiveKey,
      settings: draft.settings,
      options: (draft.options ?? []).map(
        (o): UpdateOptionDto => ({
          id: (o as any).id,
          text: o.text,
          numericValue: o.numericValue,
          orderIndex: o.orderIndex,
          optionPoints: (o.optionPoints ?? []).map(
            (p): UpdateOptionPointDto => ({
              id: (p as any).id,
              testVariableId: p.testVariableId,
              points: p.points,
            }),
          ),
        }),
      ),
    };
    this.blueprint.updateQuestion$(draft.id, update).subscribe({ error: () => {} });
  }

  confirmDeleteSelected(): void {
    const q = this.selectedQuestion();
    if (!q) {
      return;
    }
    this.confirmation.confirm({
      header: 'Delete question',
      message: `Delete "${q.variableKey}"? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.blueprint.deleteQuestion$(q.id).subscribe({ error: () => {} }),
    });
  }

  listCardStyleClass(q: BlueprintQuestion): string {
    const selected = String(this.blueprint.selectedQuestionId()) === String(q.id);
    const base =
      'cursor-pointer transition-colors transition-duration-150 shadow-1';
    return selected
      ? `${base} border-primary border-2 surface-ground`
      : `${base} surface-border border-1 surface-card hover:surface-hover`;
  }

  snippet(text: string, maxLen: number): string {
    const t = (text ?? '').trim();
    if (!t) {
      return 'No text';
    }
    return t.length <= maxLen ? t : `${t.slice(0, maxLen)}…`;
  }
}

function draftFromBlueprintQuestion(q: BlueprintQuestion): CreateQuestionCommand & { id?: string } {
  return {
    id: q.id,
    testId: q.testId,
    text: q.text,
    questionType:
      typeof q.questionType === 'number' ? q.questionType : (0 as any),
    orderIndex: q.orderIndex,
    variableKey: q.variableKey,
    settings: q.settings,
    options: (q.options ?? []).map((o) => ({
      id: o.id,
      text: o.text,
      numericValue: o.numericValue,
      orderIndex: o.orderIndex,
      optionPoints: (o.optionPoints ?? []).map((p) => ({
        id: p.id,
        testVariableId: p.testVariableId,
        points: p.points,
      })),
    })),
  };
}
