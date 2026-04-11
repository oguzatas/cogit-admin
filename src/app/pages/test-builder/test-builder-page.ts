import { Component } from '@angular/core';
import { TestBuilderComponent } from '@/app/test-builder/test-builder.component';

@Component({
  selector: 'app-test-builder-page',
  standalone: true,
  imports: [TestBuilderComponent],
  template: `<app-test-builder />`,
})
export class TestBuilderPage {}
