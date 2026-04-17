import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TestBuilderComponent } from '@/app/test-builder/test-builder.component';
import { TestBuilderStore } from '@/app/test-builder/test-builder.store';
import { TestBlueprintStore } from '@/app/tests/blueprint/test-blueprint.store';
import type { TestBuilderDraft } from '@/app/test-builder/test-builder.models';
import { TestsStore } from '@/app/pages/tests/tests.store';

@Component({
  selector: 'app-test-builder-page',
  standalone: true,
  providers: [ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FluidModule,
    ButtonModule,
    ConfirmDialogModule,
    InputTextModule,
    TextareaModule,
    TagModule,
    TestBuilderComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">

      <!-- ── Page header / nav bar ── -->
      <div class="card flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3 min-w-0">
            <p-button
              label="Back"
              icon="pi pi-arrow-left"
              severity="secondary"
              [outlined]="true"
              [rounded]="true"
              (onClick)="goBack()"
            />
            <div class="flex flex-col min-w-0">
              <span class="font-semibold text-xl truncate">{{ modeLabel() }}</span>
              @if (effectiveTestId()) {
                <span class="text-sm text-muted-color">ID: {{ effectiveTestId() }}</span>
              }
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            @if (blueprint.hasUnsavedQuestion()) {
              <p-tag value="Unsaved question" severity="warn" icon="pi pi-exclamation-circle" />
            }
            @if (isDirty()) {
              <p-tag value="Unsaved test changes" severity="warn" />
            }
            @if (effectiveTestId()) {
              <p-button
                label="Revert"
                icon="pi pi-undo"
                severity="secondary"
                [outlined]="true"
                [disabled]="!isDirty()"
                (onClick)="revert()"
              />
            }
            <p-button
              [label]="effectiveTestId() ? 'Save changes' : 'Create test'"
              icon="pi pi-check"
              [disabled]="!canSave()"
              (onClick)="save()"
            />
          </div>
        </div>

        <!-- ── Test metadata form (always visible) ── -->
        <div class="border-top-1 surface-border pt-4">
          <p-fluid>
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 md:col-span-8 flex flex-col gap-2">
                <label class="font-semibold" for="testName">Test name <span class="text-red-500">*</span></label>
                <input
                  id="testName"
                  pInputText
                  fluid
                  placeholder="e.g. Big Five Personality Assessment"
                  [ngModel]="store.testTitle()"
                  (ngModelChange)="store.updateTestTitle($event)"
                />
              </div>
              <div class="col-span-12 md:col-span-4 flex flex-col gap-2">
                <label class="font-semibold">Description <span class="text-muted-color font-normal text-sm">(optional)</span></label>
                <textarea
                  pTextarea
                  fluid
                  rows="1"
                  placeholder="Short description shown to candidates"
                  [ngModel]="description()"
                  (ngModelChange)="description.set($event)"
                ></textarea>
              </div>
            </div>
          </p-fluid>
        </div>
      </div>

      <!-- ── Question builder (only after test is created / in edit mode) ── -->
      @if (effectiveTestId()) {
        <app-test-builder [testId]="effectiveTestId()" />
      } @else {
        <div class="card flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-color">
          <i class="pi pi-file-edit text-4xl opacity-40"></i>
          <div class="font-semibold text-lg">Give your test a name and click "Create test"</div>
          <div class="text-sm max-w-24rem">
            Once created, the question builder and scoring settings will appear here.
          </div>
        </div>
      }

    </div>

    <p-confirmdialog />
  `,
})
export class TestBuilderPage {
  readonly store = inject(TestBuilderStore);
  readonly blueprint = inject(TestBlueprintStore);
  private readonly tests = inject(TestsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);

  readonly routeTestId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('testId'))),
    { initialValue: null },
  );

  private readonly baseline = signal<TestBuilderDraft | null>(null);
  private readonly currentId = signal<string | null>(null);

  /** Description is UI-only for now; wired to the update payload when saving. */
  readonly description = signal<string>('');

  readonly isEditMode = computed(() => !!this.routeTestId());
  readonly modeLabel = computed(() => (this.isEditMode() ? 'Edit test' : 'New test'));
  readonly effectiveTestId = computed(() => this.routeTestId() ?? this.currentId());

  readonly isDirty = computed(() => {
    const base = this.baseline();
    if (!base) return false;
    return serializeDraft(base) !== serializeDraft(this.store.exportDraft());
  });

  readonly canSave = computed(() => {
    const title = (this.store.testTitle() ?? '').trim();
    if (!title) return false;
    // Create mode: any non-empty title is enough to enable "Create test"
    if (!this.effectiveTestId()) return true;
    // Edit mode: require actual changes
    return this.isDirty();
  });

  constructor() {
    effect(() => {
      const id = this.routeTestId();
      untracked(() => this.loadForRoute(id));
    });
  }

  private loadForRoute(id: string | null): void {
    if (id) {
      this.tests
        .getById$(id)
        .pipe(take(1))
        .subscribe({
          next: (found) => {
            this.currentId.set(found.id);
            this.description.set(found.description ?? '');
            this.store.loadDraft({ title: found.name, questions: [] });
            this.baseline.set(cloneDraft(this.store.exportDraft()));
          },
          error: () => {
            this.store.reset();
            this.baseline.set(cloneDraft(this.store.exportDraft()));
            this.currentId.set(null);
          },
        });
      return;
    }

    // create mode — reset everything
    this.currentId.set(null);
    this.description.set('');
    this.store.reset();
    this.store.updateTestTitle('');
    this.baseline.set(cloneDraft(this.store.exportDraft()));
  }

  goBack(): void {
    if (!this.blueprint.hasUnsavedQuestion()) {
      void this.router.navigate(['/tests']);
      return;
    }
    this.confirmation.confirm({
      header: 'Unsaved question',
      message: 'You have a question that hasn\'t been saved yet. If you leave now it will be lost.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Leave anyway',
      rejectLabel: 'Stay',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.router.navigate(['/tests']),
    });
  }

  revert(): void {
    const base = this.baseline();
    if (!base) return;
    this.store.loadDraft(cloneDraft(base));
    this.messages.add({ severity: 'info', summary: 'Reverted', detail: 'Changes were discarded.' });
  }

  save(): void {
    const title = (this.store.testTitle() ?? '').trim();
    if (!title) {
      this.messages.add({ severity: 'warn', summary: 'Title required', detail: 'Please enter a test name.' });
      return;
    }

    const existingId = this.currentId();

    // ── Edit / rename ──
    if (existingId) {
      this.tests
        .update$(existingId, {
          id: existingId,
          name: title,
          description: this.description() || null,
          isPublished: false,
        })
        .pipe(take(1))
        .subscribe({
          next: () => this.baseline.set(cloneDraft(this.store.exportDraft())),
          error: () => {},
        });
      return;
    }

    // ── Create new ──
    this.tests
      .create$({ name: title, description: this.description() || null })
      .pipe(take(1))
      .subscribe({
        next: (created) => {
          this.currentId.set(created.id);
          this.baseline.set(cloneDraft(this.store.exportDraft()));
          void this.router.navigate(['/tests', created.id, 'edit']);
        },
        error: () => {},
      });
  }
}

function cloneDraft(d: TestBuilderDraft): TestBuilderDraft {
  return JSON.parse(JSON.stringify(d)) as TestBuilderDraft;
}

function serializeDraft(d: TestBuilderDraft): string {
  // stable enough for UI-only dirty checking
  return JSON.stringify(d);
}
