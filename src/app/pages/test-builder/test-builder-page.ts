import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TestBuilderComponent } from '@/app/test-builder/test-builder.component';
import { TestBuilderStore } from '@/app/test-builder/test-builder.store';
import type { TestBuilderDraft } from '@/app/test-builder/test-builder.models';
import { TestsStore } from '@/app/pages/tests/tests.store';

@Component({
  selector: 'app-test-builder-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, TestBuilderComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="card flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <p-button
              label="Back"
              icon="pi pi-arrow-left"
              severity="secondary"
              [outlined]="true"
              [rounded]="true"
              styleClass="font-semibold"
              (onClick)="goBack()"
            />
            <div class="flex flex-col min-w-0">
              <div class="font-semibold text-xl truncate">{{ headerTitle() }}</div>
              <div class="text-sm text-muted-color truncate">
                {{ modeLabel() }}
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            @if (isDirty()) {
              <p-tag value="Unsaved changes" severity="warn" />
            }
            <p-button
              label="Revert"
              icon="pi pi-undo"
              severity="secondary"
              [outlined]="true"
              [disabled]="!isDirty()"
              (onClick)="revert()"
            />
            <p-button
              label="Save"
              icon="pi pi-check"
              [disabled]="!canSave()"
              (onClick)="save()"
            />
          </div>
        </div>
      </div>

      <app-test-builder [testId]="effectiveTestId()" />
    </div>
  `,
})
export class TestBuilderPage {
  private readonly store = inject(TestBuilderStore);
  private readonly tests = inject(TestsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly routeTestId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('testId'))),
    { initialValue: null },
  );

  private readonly baseline = signal<TestBuilderDraft | null>(null);
  private readonly currentId = signal<string | null>(null);

  readonly isEditMode = computed(() => !!this.routeTestId());
  readonly modeLabel = computed(() => (this.isEditMode() ? 'Edit test' : 'Create test'));

  readonly effectiveTestId = computed(() => this.routeTestId() ?? this.currentId());

  readonly headerTitle = computed(() => {
    const title = (this.store.testTitle() ?? '').trim();
    return title || 'Untitled assessment';
  });

  readonly isDirty = computed(() => {
    const base = this.baseline();
    if (!base) {
      return false;
    }
    return serializeDraft(base) !== serializeDraft(this.store.exportDraft());
  });

  readonly canSave = computed(() => {
    const title = (this.store.testTitle() ?? '').trim();
    return !!title && this.isDirty();
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
            // Backend test currently only has name/description/publish; builder questions remain UI-only for now.
            this.store.loadDraft({
              title: found.name,
              questions: [],
            });
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

    // create mode
    this.currentId.set(null);
    this.store.reset();
    this.baseline.set(cloneDraft(this.store.exportDraft()));
  }

  goBack(): void {
    void this.router.navigate(['/tests']);
  }

  revert(): void {
    const base = this.baseline();
    if (!base) {
      return;
    }
    this.store.loadDraft(cloneDraft(base));
    this.messages.add({
      severity: 'info',
      summary: 'Reverted',
      detail: 'Changes were discarded.',
    });
  }

  save(): void {
    const draft = cloneDraft(this.store.exportDraft());
    const title = (draft.title ?? '').trim();
    if (!title) {
      this.messages.add({
        severity: 'warn',
        summary: 'Title required',
        detail: 'Please enter a test title before saving.',
      });
      return;
    }

    if (this.currentId) {
      this.tests
        .update$(this.currentId()!, {
          id: this.currentId()!,
          name: title,
          description: null,
          isPublished: false,
        })
        .pipe(take(1))
        .subscribe({
          next: () => this.baseline.set(cloneDraft(this.store.exportDraft())),
          error: () => {},
        });
      return;
    }

    this.tests
      .create$({ name: title, description: null })
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
