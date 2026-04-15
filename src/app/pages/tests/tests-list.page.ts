import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TestsStore } from './tests.store';

@Component({
  selector: 'app-tests-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
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
              Manage tests, update drafts, and publish when ready.
            </p>
          </div>
        </div>
      </div>

      <div class="card relative min-w-0 overflow-hidden">
        @if (store.listLoading()) {
          <div
            class="absolute inset-0 z-2 flex items-center justify-center bg-surface-0/70 dark:bg-surface-900/70 border-round"
          >
            <i class="pi pi-spin pi-spinner text-2xl text-muted-color"></i>
          </div>
        }

        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="font-semibold text-lg">All tests</div>
          <div class="flex items-center gap-2 text-sm text-muted-color">
            <span>{{ store.tests().length }} total</span>
            <span class="text-muted-color">•</span>
            <span>{{ store.publishedCount() }} published</span>
          </div>
        </div>

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
              <th style="min-width: 18rem">Name</th>
              <th style="width: 10rem">Status</th>
              <th style="width: 14rem">Created</th>
              <th style="width: 16rem"></th>
            </tr>
          </ng-template>
          <ng-template #body let-test>
            <tr (click)="editTest(test.id)" class="cursor-pointer">
              <td class="font-semibold">{{ test.name }}</td>
              <td>
                <p-tag
                  [value]="test.isPublished ? 'Published' : 'Draft'"
                  [severity]="test.isPublished ? 'success' : 'secondary'"
                />
              </td>
              <td class="text-sm text-muted-color">
                {{ test.created | date: 'medium' }}
              </td>
              <td (click)="$event.stopPropagation()">
                <div class="flex justify-end gap-2">
                  <p-button
                    label="Edit"
                    icon="pi pi-pencil"
                    severity="secondary"
                    [outlined]="true"
                    [rounded]="true"
                    size="small"
                    (onClick)="editTest(test.id)"
                  />
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [outlined]="true"
                    [rounded]="true"
                    size="small"
                    aria-label="Delete test"
                    (onClick)="confirmDelete(test)"
                  />
                </div>
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

        <p-confirmDialog />
      </div>
    </div>
  `,
})
export class TestsListPage {
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  readonly store = inject(TestsStore);

  readonly rows = computed(() => this.store.tests());

  constructor() {
    effect(() => this.store.refresh());
  }

  createTest(): void {
    void this.router.navigate(['/tests/new']);
  }

  editTest(id: string): void {
    void this.router.navigate(['/tests', id, 'edit']);
  }

  confirmDelete(test: { id: string; name: string }): void {
    this.confirm.confirm({
      header: 'Delete test',
      message: `Delete “${test.name}”? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.store.delete$(test.id).subscribe(),
    });
  }
}

