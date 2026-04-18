import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TestExecutionStore } from '@/app/tests/execution/test-execution.store';
import { isAssignmentAlreadySubmittedAccessError } from '@/app/core/api/utils/api-error-message';
import type { SessionQuestionDto } from '@/app/core/api/models/test-execution.dto';

type Step = 'loading' | 'welcome' | 'take' | 'done' | 'error' | 'alreadyCompleted';

@Component({
  selector: 'app-assessment-invite-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
  ],
  template: `
    @if (step() === 'loading') {
      <div class="flex flex-col items-center justify-center gap-4 py-16">
        <p-progressSpinner styleClass="w-12 h-12" />
        <p class="m-0 text-muted-color">Opening your assessment…</p>
      </div>
    }

    @if (step() === 'error') {
      <p-card>
        <div class="flex flex-col gap-4 items-center text-center py-8">
          <i class="pi pi-times-circle text-4xl text-red-500"></i>
          <h2 class="m-0 text-xl font-semibold">We couldn’t open this link</h2>
          <p class="m-0 text-muted-color max-w-md">
            The link may be invalid or expired. Ask your administrator for a new invitation.
          </p>
        </div>
      </p-card>
    }

    @if (step() === 'alreadyCompleted') {
      <p-card>
        <div class="flex flex-col gap-4 items-center text-center py-10 px-4 max-w-lg mx-auto">
          <i class="pi pi-check-circle text-6xl text-green-500"></i>
          <h2 class="m-0 text-2xl font-semibold text-color">Assessment Completed</h2>
          <p class="m-0 text-muted-color line-height-3">
            You have already completed and submitted this assessment. Thank you for your time. You can safely close this window.
          </p>
        </div>
      </p-card>
    }

    @if (step() === 'welcome') {
      @if (store.session(); as s) {
        <p-card>
          <div class="flex flex-col gap-6 py-4">
            <div class="text-center">
              <span class="text-sm font-semibold uppercase tracking-wide text-primary">Welcome</span>
              <h1 class="m-0 mt-2 text-2xl md:text-3xl font-bold text-color">{{ s.testName }}</h1>
              <p class="m-0 mt-3 text-muted-color">
                When you’re ready, begin the assessment. You can complete it in one sitting.
              </p>
            </div>
            <div class="flex justify-center">
              <p-button label="Begin assessment" icon="pi pi-play" (onClick)="begin()" />
            </div>
          </div>
        </p-card>
      }
    }

    @if (step() === 'take') {
      @if (store.session(); as s) {
      <div class="flex flex-col gap-6">
        <div class="text-center">
          <h1 class="m-0 text-xl md:text-2xl font-bold">{{ s.testName }}</h1>
          <p class="m-0 mt-1 text-sm text-muted-color">{{ s.questions.length }} question(s)</p>
        </div>

        @for (q of s.questions; track q.id; let qi = $index) {
          <p-card>
            <div class="flex flex-col gap-4">
              <div class="font-semibold text-lg">
                <span class="text-muted-color mr-2">{{ qi + 1 }}.</span>
                {{ q.text }}
              </div>

              @if (isChoice(q)) {
                <div class="flex flex-col gap-2">
                  @for (opt of q.options; track opt.id) {
                    <label class="flex items-center gap-3 cursor-pointer p-3 border-round border-1 surface-border hover:surface-hover">
                      <input
                        type="radio"
                        class="cursor-pointer"
                        [name]="'q-' + q.id"
                        [value]="opt.id"
                        [checked]="selectedOption(q.id) === opt.id"
                        (change)="pickOption(q, opt.id)"
                      />
                      <span>{{ opt.text }}</span>
                    </label>
                  }
                </div>
              } @else {
                <textarea
                  class="w-full p-3 border-round border-1 surface-border bg-transparent text-color"
                  rows="3"
                  placeholder="Your answer"
                  [ngModel]="textAnswer(q.id)"
                  (ngModelChange)="setTextAnswer(q.id, $event)"
                ></textarea>
              }
            </div>
          </p-card>
        }

        <div class="flex justify-end gap-2 pt-2">
          <p-button
            label="Submit assessment"
            icon="pi pi-check"
            [loading]="store.submitting()"
            [disabled]="!canSubmit(s) || store.submitting()"
            (onClick)="submit()"
          />
        </div>
      </div>
      }
    }

    @if (step() === 'done') {
      <p-card>
        <div class="flex flex-col gap-4 items-center text-center py-10">
          <i class="pi pi-check-circle text-5xl text-green-500"></i>
          <h2 class="m-0 text-2xl font-semibold">Thank you</h2>
          <p class="m-0 text-muted-color">Your responses have been submitted.</p>
        </div>
      </p-card>
    }
  `,
})
export class AssessmentInvitePage implements OnDestroy {
  readonly store = inject(TestExecutionStore);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<Step>('loading');

  /** Single-choice: questionId → optionId */
  private readonly picks = signal<Record<string, string>>({});
  /** Text / number questions */
  private readonly texts = signal<Record<string, string>>({});

  constructor() {
    const accessKey = this.route.snapshot.paramMap.get('accessKey');
    if (!accessKey) {
      this.step.set('error');
      return;
    }
    this.store.clear();
    this.store
      .exchangeAccessKey$(accessKey)
      .pipe(switchMap(() => this.store.loadSession$()))
      .subscribe({
        next: () => this.step.set('welcome'),
        error: (err) => {
          if (isAssignmentAlreadySubmittedAccessError(err)) {
            this.step.set('alreadyCompleted');
          } else {
            this.step.set('error');
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.store.clear();
  }

  selectedOption(questionId: string): string | undefined {
    return this.picks()[questionId];
  }

  textAnswer(questionId: string): string {
    return this.texts()[questionId] ?? '';
  }

  isChoice(q: SessionQuestionDto): boolean {
    const t = String(q.questionType ?? '').toLowerCase();
    return t.includes('choice') || t === 'singlechoice' || t === 'multiplechoice';
  }

  pickOption(q: SessionQuestionDto, optionId: string): void {
    this.picks.update((m) => ({ ...m, [String(q.id)]: String(optionId) }));
    const payload = {
      questionId: q.id,
      selectedOptionIds: [optionId],
    };
    this.store.upsertAnswer$(payload).subscribe({ error: () => {} });
  }

  setTextAnswer(questionId: string, value: string): void {
    this.texts.update((m) => ({ ...m, [String(questionId)]: value }));
    this.store
      .upsertAnswer$({
        questionId,
        selectedOptionIds: [],
        textValue: value || null,
      })
      .subscribe({ error: () => {} });
  }

  begin(): void {
    this.step.set('take');
  }

  canSubmit(s: { questions: SessionQuestionDto[] }): boolean {
    for (const q of s.questions) {
      if (this.isChoice(q)) {
        if (!this.picks()[String(q.id)]) {
          return false;
        }
      } else {
        const t = (this.texts()[String(q.id)] ?? '').trim();
        if (q.isRequired && !t) {
          return false;
        }
      }
    }
    return s.questions.length > 0;
  }

  submit(): void {
    const s = this.store.session();
    if (!s || !this.canSubmit(s)) {
      return;
    }
    this.store.submit$().subscribe({
      next: () => this.step.set('done'),
      error: () => {},
    });
  }
}
