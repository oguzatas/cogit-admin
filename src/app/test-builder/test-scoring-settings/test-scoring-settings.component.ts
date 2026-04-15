import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { TestBlueprintStore } from '@/app/tests/blueprint/test-blueprint.store';
import type { TestVariable, ScoringMetric } from '@/app/core/api/models/test-blueprint.models';
import type {
  CreateScoringScaleCommand,
  CreateTestVariableCommand,
  UpdateScoringScaleCommand,
  UpdateTestVariableCommand,
} from '@/app/core/api/models/test-blueprint.dto';

@Component({
  selector: 'app-test-scoring-settings',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    TabsModule,
    TextareaModule,
  ],
  templateUrl: './test-scoring-settings.component.html',
})
export class TestScoringSettingsComponent {
  readonly blueprint = inject(TestBlueprintStore);

  // ── Variables ──
  readonly newVariable = signal<CreateTestVariableCommand>({
    name: '',
    key: '',
    defaultValue: 0,
  } as CreateTestVariableCommand);

  readonly variableEdits = signal<Record<string, UpdateTestVariableCommand>>({});

  patchNewVariable(patch: Partial<CreateTestVariableCommand>): void {
    this.newVariable.set({ ...this.newVariable(), ...patch } as CreateTestVariableCommand);
  }

  ensureVariableEdit(v: TestVariable): UpdateTestVariableCommand {
    const cur = this.variableEdits();
    const existing = cur[v.id];
    if (existing) {
      return existing;
    }
    const next: UpdateTestVariableCommand = {
      id: v.id,
      name: v.name,
      key: v.key,
      defaultValue: v.defaultValue,
    } as UpdateTestVariableCommand;
    this.variableEdits.set({ ...cur, [v.id]: next });
    return next;
  }

  patchVariableEdit(id: string, patch: Partial<UpdateTestVariableCommand>): void {
    const cur = this.variableEdits();
    const base = cur[id] ?? ({ id, name: '', key: '', defaultValue: 0 } as UpdateTestVariableCommand);
    this.variableEdits.set({ ...cur, [id]: { ...base, ...patch } });
  }

  createVariable(): void {
    const tid = this.blueprint.testId();
    if (!tid) {
      return;
    }
    const v = this.newVariable();
    if (!v.name.trim() || !v.key.trim()) {
      return;
    }
    this.blueprint.createVariable$(v).subscribe({
      next: () => this.newVariable.set({ name: '', key: '', defaultValue: 0 } as CreateTestVariableCommand),
      error: () => {},
    });
  }

  saveVariable(id: string): void {
    const e = this.variableEdits()[id];
    if (!e || !e.name.trim() || !e.key.trim()) {
      return;
    }
    this.blueprint.updateVariable$(id, e).subscribe({ error: () => {} });
  }

  deleteVariable(id: string): void {
    this.blueprint.deleteVariable$(id).subscribe({ error: () => {} });
  }

  // ── Metrics / Formulas ──
  readonly newMetric = signal<CreateScoringScaleCommand>({
    name: '',
    key: '',
    formulaExpression: '',
  } as CreateScoringScaleCommand);

  readonly metricEdits = signal<Record<string, UpdateScoringScaleCommand>>({});

  patchNewMetric(patch: Partial<CreateScoringScaleCommand>): void {
    this.newMetric.set({ ...this.newMetric(), ...patch } as CreateScoringScaleCommand);
  }

  ensureMetricEdit(m: ScoringMetric): UpdateScoringScaleCommand {
    const cur = this.metricEdits();
    const existing = cur[m.id];
    if (existing) {
      return existing;
    }
    const next: UpdateScoringScaleCommand = {
      id: m.id,
      name: m.name,
      formulaExpression: m.formulaExpression,
    } as UpdateScoringScaleCommand;
    this.metricEdits.set({ ...cur, [m.id]: next });
    return next;
  }

  patchMetricEdit(id: string, patch: Partial<UpdateScoringScaleCommand>): void {
    const cur = this.metricEdits();
    const base = cur[id] ?? ({ id, name: '', formulaExpression: '' } as UpdateScoringScaleCommand);
    this.metricEdits.set({ ...cur, [id]: { ...base, ...patch } });
  }

  createMetric(): void {
    const tid = this.blueprint.testId();
    if (!tid) {
      return;
    }
    const m = this.newMetric();
    if (!m.name.trim() || !m.formulaExpression.trim()) {
      return;
    }
    this.blueprint.createMetric$(m).subscribe({
      next: () =>
        this.newMetric.set({ name: '', key: '', formulaExpression: '' } as CreateScoringScaleCommand),
      error: () => {},
    });
  }

  saveMetric(id: string): void {
    const e = this.metricEdits()[id];
    if (!e || !e.name.trim() || !e.formulaExpression.trim()) {
      return;
    }
    this.blueprint.updateMetric$(id, e).subscribe({ error: () => {} });
  }

  deleteMetric(id: string): void {
    this.blueprint.deleteMetric$(id).subscribe({ error: () => {} });
  }
}
