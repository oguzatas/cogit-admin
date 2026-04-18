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

export type HeroOutcome =
  | { kind: 'text'; value: string }
  | { kind: 'score'; value: number };

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
  styleUrl: './assignment-report.page.scss',
})
export class AssignmentReportPage {
  private static readonly PROFILE_FILL = [
    'rgba(99, 102, 241, 0.78)',
    'rgba(16, 185, 129, 0.78)',
    'rgba(245, 158, 11, 0.78)',
    'rgba(236, 72, 153, 0.78)',
    'rgba(14, 165, 233, 0.78)',
    'rgba(168, 85, 247, 0.78)',
    'rgba(239, 68, 68, 0.72)',
    'rgba(20, 184, 166, 0.78)',
  ];

  private static readonly PROFILE_BORDER = [
    'rgb(99, 102, 241)',
    'rgb(16, 185, 129)',
    'rgb(245, 158, 11)',
    'rgb(236, 72, 153)',
    'rgb(14, 165, 233)',
    'rgb(168, 85, 247)',
    'rgb(239, 68, 68)',
    'rgb(20, 184, 166)',
  ];

  readonly review = inject(TestReviewStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Prefer live paramMap; snapshot initialValue avoids a one-tick null before first emission (skips load). */
  readonly assignmentId = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('assignmentId') ?? p.get('id')),
    ),
    {
      initialValue:
        this.route.snapshot.paramMap.get('assignmentId') ??
        this.route.snapshot.paramMap.get('id') ??
        null,
    },
  );

  /** Points draft for manual grading keyed by questionId */
  readonly manualDrafts = signal<Record<string, number>>({});

  readonly profileChartType = signal<'bar' | 'radar'>('bar');

  /** Prominent outcome from first calculated row: type code vs numeric score. */
  readonly heroOutcome = computed((): HeroOutcome | null => {
    const res = this.review.results();
    const first = res?.results?.[0];
    if (!first) {
      return null;
    }
    const text = first.resultText?.trim();
    if (text) {
      return { kind: 'text', value: text };
    }
    const raw = first.calculatedScore ?? first.points;
    if (raw == null || raw === '') {
      return null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return null;
    }
    return { kind: 'score', value: n };
  });

  /** `variableTotals` drives the chart when present; otherwise legacy `results` rows. */
  readonly profileChartUsesVariableTotals = computed(() => {
    const vt = this.review.results()?.variableTotals;
    return Boolean(vt && Object.keys(vt).length > 0);
  });

  readonly profileChartData = computed(() => {
    const res = this.review.results();
    if (!res) {
      return null;
    }
    const vt = res.variableTotals;
    if (vt && Object.keys(vt).length > 0) {
      const entries = Object.entries(vt).sort(
        ([, a], [, b]) => Number(b) - Number(a),
      );
      const labels = entries.map(([k]) => k.trim().toUpperCase());
      const data = entries.map(([, v]) => Number(v));
      const n = AssignmentReportPage.PROFILE_FILL.length;
      return {
        labels,
        datasets: [
          {
            label: 'Variable total',
            data,
            backgroundColor: entries.map(
              (_, i) => AssignmentReportPage.PROFILE_FILL[i % n],
            ),
            borderColor: entries.map(
              (_, i) => AssignmentReportPage.PROFILE_BORDER[i % n],
            ),
            borderWidth: 1.5,
          },
        ],
      };
    }
    const rows = res.results ?? [];
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
          backgroundColor: 'rgba(16, 185, 129, 0.38)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
      ],
    };
  });

  private readonly barChartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset?: { label?: string }; parsed: { y?: number; x?: number } }) => {
            const v =
              ctx.parsed.y != null
                ? ctx.parsed.y
                : ctx.parsed.x != null
                  ? ctx.parsed.x
                  : 0;
            const prefix = ctx.dataset?.label ? `${ctx.dataset.label}: ` : '';
            return `${prefix}${v}`;
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true },
      x: {
        ticks: { maxRotation: 40, minRotation: 0 },
      },
    },
  };

  private readonly radarChartOptionsBase = {
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

  readonly profileChartOptions = computed(() => {
    const data = this.profileChartData();
    const kind = this.profileChartType();
    const nums = (data?.datasets[0]?.data ?? []) as number[];
    const maxVal = nums.length ? Math.max(...nums, 1) : 1;
    const suggestedMax = Math.ceil(maxVal * 1.12);
    if (kind === 'radar') {
      return {
        ...this.radarChartOptionsBase,
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax,
          },
        },
      };
    }
    return { ...this.barChartOptionsBase };
  });

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
        this.review.loadResults$(id).subscribe({
          error: () => {
            /* toast + empty state from store */
          },
        });
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

  toggleProfileChartKind(): void {
    this.profileChartType.update((t) => (t === 'bar' ? 'radar' : 'bar'));
  }
}
