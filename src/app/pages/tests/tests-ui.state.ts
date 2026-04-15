import { Injectable, signal } from '@angular/core';
import type { Question } from '@/app/test-builder/test-builder.models';

export interface TestUiModel {
  id: string;
  title: string;
  questions: Question[];
  updatedAt: string;
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function seedTests(): TestUiModel[] {
  const now = new Date().toISOString();
  return [
    {
      id: '1',
      title: 'Safety onboarding (demo)',
      questions: [],
      updatedAt: now,
    },
    {
      id: '2',
      title: 'IT access request (demo)',
      questions: [],
      updatedAt: now,
    },
  ];
}

/**
 * UI-only in-memory state for tests, used to power the list + builder flow
 * until real endpoints are integrated.
 */
@Injectable({ providedIn: 'root' })
export class TestsUiState {
  readonly tests = signal<TestUiModel[]>(seedTests());

  getById(id: string): TestUiModel | null {
    return this.tests().find((t) => String(t.id) === String(id)) ?? null;
  }

  createBlank(): TestUiModel {
    const now = new Date().toISOString();
    return {
      id: createId(),
      title: 'Untitled assessment',
      questions: [],
      updatedAt: now,
    };
  }

  upsert(test: Omit<TestUiModel, 'updatedAt'> & { updatedAt?: string }): void {
    const next: TestUiModel = {
      ...deepClone(test as TestUiModel),
      updatedAt: test.updatedAt ?? new Date().toISOString(),
    };
    this.tests.update((list) => {
      const i = list.findIndex((t) => String(t.id) === String(next.id));
      if (i === -1) {
        return [next, ...list];
      }
      const copy = [...list];
      copy[i] = next;
      return copy;
    });
  }

  snapshot(test: TestUiModel): TestUiModel {
    return deepClone(test);
  }
}

