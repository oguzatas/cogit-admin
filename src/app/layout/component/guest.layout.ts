import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';

/**
 * Minimal shell for public, unauthenticated flows (candidate assessments).
 * No admin chrome — only a content area and global toast.
 */
@Component({
  selector: 'app-guest-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule],
  template: `
    <div class="guest-layout min-h-screen surface-ground">
      <main class="guest-layout-main">
        <router-outlet />
      </main>
      <p-toast />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .guest-layout-main {
      max-width: 56rem;
      margin: 0 auto;
      padding: 1.5rem 1rem 3rem;
    }
  `,
})
export class GuestLayout {}
