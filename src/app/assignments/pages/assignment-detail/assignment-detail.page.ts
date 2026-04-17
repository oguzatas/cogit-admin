import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-assignment-detail-page',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="card flex flex-col items-center text-center gap-4 py-12">
      <i class="pi pi-arrow-circle-left text-4xl text-muted-color opacity-60"></i>
      <h4 class="m-0 font-semibold text-xl">Assignment details have moved</h4>
      <p class="m-0 text-muted-color max-w-28rem">
        Employee assignments and magic links are now managed directly from the
        Assignments list page.
      </p>
      <p-button
        label="Go to Assignments"
        icon="pi pi-arrow-left"
        (onClick)="goBack()"
      />
    </div>
  `,
})
export class AssignmentDetailPage {
  private readonly router = inject(Router);

  goBack(): void {
    void this.router.navigate(['/assignments']);
  }
}
