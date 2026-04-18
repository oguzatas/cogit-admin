import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TestReviewStore } from '@/app/tests/review/test-review.store';
import type { AssignmentAnswerViewDto } from '@/app/core/api/models/test-review.dto';

@Component({
  selector: 'app-assignment-report-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    ChartModule,
    InputNumberModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './assignment-report.page.html',
})
export class AssignmentReportPage {
  readonly review = inject(TestReviewStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly assignmentId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('assignmentId'))),
    { initialValue: null },
  );

  /** Points draft for manual grading keyed by questionId */
  readonly manualDrafts = signal<Record<string, number>>({});

  readonly chartType = signal<'bar' | 'radar'>('bar');

  readonly chartData = computed(() => {
    const res = this.review.results();
    const rows = res?.results ?? [];
    if (rows.length === 0) {
      return null;
    }
    const labels = rows.map((r) => (r.scaleName || r.variableKey).trim() || r.variableKey);
    const data = rows.map((r) => Number(r.calculatedScore ?? r.points ?? 0));
    return {
      labels,
      datasets: [
        {
          label: 'Score',
          data,
          backgroundColor: 'rgba(16, 185, 129, 0.35)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
      ],
    };
  });

  private readonly barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
    },
    scales: {
      y: { beginAtZero: true },
      x: {
        ticks: { maxRotation: 40, minRotation: 0 },
      },
    },
  };

  private readonly radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
    },
    scales: {
      r: {
        suggestedMin: 0,
      },
    },
  };

  readonly manualAnswers = computed(() =>
    (this.review.results()?.answers ?? []).filter((a) => a.requiresManualGrade),
  );

  constructor() {
    effect(() => {
      const id = this.assignmentId();
      if (!id) {
        untracked(() => this.review.setAssignmentId(null));
        return;
      }
      untracked(() => {
        this.review.loadResults$(id).subscribe({ error: () => {} });
      });
    });

    effect(() => {
      const answers = this.review.results()?.answers ?? [];
      untracked(() => {
        const next: Record<string, number> = {};
        for (const a of answers) {
          if (a.requiresManualGrade) {
            const prev = a.pointsAwarded != null && a.pointsAwarded !== '' ? Number(a.pointsAwarded) : 0;
            next[String(a.questionId)] = Number.isFinite(prev) ? prev : 0;
          }
        }
        this.manualDrafts.set(next);
      });
    });
  }

  activeChartOptions(): object {
    return this.chartType() === 'radar' ? this.radarChartOptions : this.barChartOptions;
  }

  formatAnswer(a: AssignmentAnswerViewDto): string {
    if (a.userAnswerLabel) {
      return a.userAnswerLabel;
    }
    if (a.textValue != null && String(a.textValue).trim() !== '') {
      return String(a.textValue);
    }
    if (a.numberValue != null && String(a.numberValue).trim() !== '') {
      return String(a.numberValue);
    }
    if (a.selectedOptionIds?.length) {
      return a.selectedOptionIds.length + ' option(s) selected';
    }
    return '—';
  }

  pointsDisplay(a: AssignmentAnswerViewDto): string {
    if (a.pointsAwarded == null || a.pointsAwarded === '') {
      return '—';
    }
    return String(a.pointsAwarded);
  }

  statusSeverity(
    status: string,
  ): 'success' | 'info' | 'secondary' | 'warn' | 'danger' | 'contrast' | null {
    const s = (status ?? '').toLowerCase().replace(/\s+/g, '');
    if (s === 'completed') {
      return 'success';
    }
    if (s.includes('await') && s.includes('manual')) {
      return 'warn';
    }
    return 'secondary';
  }

  qkey(id: string | number): string {
    return String(id);
  }

  draftForQuestion(questionId: string | number): number {
    return this.manualDrafts()[this.qkey(questionId)] ?? 0;
  }

  patchDraft(questionId: string, value: number | null): void {
    const n = value ?? 0;
    this.manualDrafts.update((m) => ({ ...m, [questionId]: n }));
  }

  saveManualGrade(a: AssignmentAnswerViewDto): void {
    const id = this.assignmentId();
    if (!id) {
      return;
    }
    const qid = this.qkey(a.questionId);
    const pts = this.manualDrafts()[qid] ?? 0;
    this.review
      .submitManualGrade$(id, {
        variableKey: a.variableKey ?? undefined,
        questionId: a.questionId,
        points: pts,
      })
      .subscribe({
        next: () => {
          this.review.loadResults$(id).subscribe({ error: () => {} });
        },
        error: () => {},
      });
  }

  goBack(): void {
    void this.router.navigate(['/assignments/results']);
  }

  toggleChartKind(): void {
    this.chartType.update((t) => (t === 'bar' ? 'radar' : 'bar'));
  }
}
