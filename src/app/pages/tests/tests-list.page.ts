import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TestsUiState } from './tests-ui.state';

@Component({
  selector: 'app-tests-list-page',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule],
  template: `
    <div class="flex flex-col gap-4">
      <div
        class="card border-round-2xl overflow-hidden p-0 border-1 surface-border surface-50 dark:surface-900 shadow-1"
      >
        <div class="relative px-4 py-6 md:px-6 md:py-8">
          <div
            class="flex justify-center md:justify-end md:absolute md:right-5 md:top-5 z-1 mb-4 md:mb-0"
          >
            <p-button
              label="Create test"
              icon="pi pi-plus"
              severity="secondary"
              [outlined]="true"
              [rounded]="true"
              styleClass="font-semibold"
              (onClick)="createTest()"
            />
          </div>
          <div
            class="flex flex-col items-center text-center gap-3 max-w-48rem mx-auto px-2 md:px-14 pt-1 md:pt-0"
          >
            <span
              class="inline-flex items-center justify-center px-3 py-1 border-round-md text-xs font-bold uppercase tracking-wide text-primary surface-ground border-1 border-primary"
            >
              Assessments
            </span>
            <h1 class="m-0 font-bold text-3xl md:text-4xl text-color leading-tight">
              Tests
            </h1>
            <p class="m-0 text-muted-color text-base md:text-lg max-w-36rem line-height-3">
              Create and edit tests using the builder UI. (Endpoints will be
              integrated next.)
            </p>
          </div>
        </div>
      </div>

      <div class="card relative min-w-0 overflow-hidden">
        <div class="font-semibold text-lg mb-4">All tests</div>

        <p-table
          [value]="rows()"
          dataKey="id"
          [rowHover]="true"
          [stripedRows]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
          styleClass="w-full p-datatable-sm"
        >
          <ng-template #header>
            <tr>
              <th style="min-width: 18rem">Title</th>
              <th style="width: 10rem">Questions</th>
              <th style="width: 14rem">Updated</th>
              <th style="width: 12rem"></th>
            </tr>
          </ng-template>
          <ng-template #body let-test>
            <tr (click)="editTest(test.id)" class="cursor-pointer">
              <td class="font-semibold">{{ test.title }}</td>
              <td>
                <p-tag
                  [value]="test.questionCount.toString()"
                  severity="info"
                />
              </td>
              <td class="text-sm text-muted-color">
                {{ test.updatedAt | date: 'medium' }}
              </td>
              <td (click)="$event.stopPropagation()">
                <p-button
                  label="Edit"
                  icon="pi pi-pencil"
                  severity="secondary"
                  [outlined]="true"
                  [rounded]="true"
                  size="small"
                  (onClick)="editTest(test.id)"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="4" class="text-center text-muted-color py-6">
                No tests yet. Click “Create test” to get started.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class TestsListPage {
  private readonly router = inject(Router);
  readonly state = inject(TestsUiState);

  readonly rows = computed(() =>
    this.state.tests().map((t) => ({
      id: t.id,
      title: t.title,
      questionCount: t.questions.length,
      updatedAt: t.updatedAt,
    })),
  );

  createTest(): void {
    void this.router.navigate(['/tests/new']);
  }

  editTest(id: string): void {
    void this.router.navigate(['/tests', id, 'edit']);
  }
}

