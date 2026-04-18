import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '@/app/layout/service/layout.service';
import { AuthService } from '@/app/core/api/services/auth.service';
import { AuthIdentityService } from '@/app/core/api/services/auth-identity.service';
import { AuthClaimsService } from '@/app/core/auth/auth-claims.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    StyleClassModule,
    AppConfigurator,
    ButtonModule,
    PopoverModule,
  ],
  template: ` <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <button
        type="button"
        class="layout-menu-button layout-topbar-action"
        (click)="layoutService.onMenuToggle()"
        aria-label="Toggle menu"
      >
        <i class="pi pi-bars"></i>
      </button>
      <a class="layout-topbar-logo" routerLink="/">
        <svg viewBox="0 0 100 108" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:32px">
          <defs>
            <linearGradient id="scorion-topbar-grad" x1="50" y1="100" x2="50" y2="6" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="#0d2448"/>
              <stop offset="50%"  stop-color="#0b6d8a"/>
              <stop offset="100%" stop-color="#00c8d4"/>
            </linearGradient>
          </defs>
          <path fill="url(#scorion-topbar-grad)" d="M51 97 C62 90,86 74,90 52 C93 32,79 10,61 7 L59 18 C72 21,82 38,79 52 C76 67,57 83,51 89 Z"/>
          <path fill="url(#scorion-topbar-grad)" d="M49 97 C38 90,14 74,10 52 C7 32,21 10,39 7 L41 18 C28 21,18 38,21 52 C24 67,43 83,49 89 Z"/>
        </svg>
        <span>Scorion</span>
      </a>
    </div>

    <div class="layout-topbar-actions">
      <div class="layout-config-menu flex items-center gap-1">
        <button
          type="button"
          class="layout-topbar-action"
          (click)="toggleDarkMode()"
          aria-label="Toggle dark mode"
        >
          <i
            [ngClass]="{
              pi: true,
              'pi-moon': layoutService.isDarkTheme(),
              'pi-sun': !layoutService.isDarkTheme(),
            }"
          ></i>
        </button>
        <div class="relative">
          <button
            type="button"
            class="layout-topbar-action layout-topbar-action-highlight"
            pStyleClass="@next"
            enterFromClass="hidden"
            enterActiveClass="animate-scalein"
            leaveToClass="hidden"
            leaveActiveClass="animate-fadeout"
            [hideOnOutsideClick]="true"
            aria-label="Theme colors"
          >
            <i class="pi pi-palette"></i>
          </button>
          <app-configurator />
        </div>
      </div>

      <button
        type="button"
        class="layout-topbar-action layout-topbar-action-highlight shrink-0 rounded-full w-10 h-10 inline-flex items-center justify-center font-semibold text-sm"
        (click)="profilePopover.toggle($event)"
        aria-label="Account menu"
        [attr.title]="identity.email() ?? 'Account'"
      >
        {{ avatarLabel() }}
      </button>

      <p-popover #profilePopover [style]="{ width: 'min(20rem, 92vw)' }">
        <div class="flex flex-col gap-4 p-1">
          <div>
            <div class="text-muted-color text-xs font-medium uppercase tracking-wide mb-1">
              Signed in as
            </div>
            <div class="text-surface-900 dark:text-surface-0 font-medium break-all text-sm">
              {{ identity.email() ?? '—' }}
            </div>
          </div>
          <p-button
            label="Log out"
            icon="pi pi-sign-out"
            severity="danger"
            [fluid]="true"
            [loading]="logoutPending()"
            (onClick)="onLogout(profilePopover)"
          />
        </div>
      </p-popover>
    </div>
  </div>`,
})
export class AppTopbar {
  readonly layoutService = inject(LayoutService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly identity = inject(AuthIdentityService);
  private readonly claims = inject(AuthClaimsService);

  readonly logoutPending = signal(false);

  readonly avatarLabel = computed(() => {
    const email = this.identity.email();
    if (!email) {
      return '?';
    }
    const local = email.split('@')[0] ?? email;
    const parts = local.split(/[.\-_]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    const two = local.slice(0, 2).toUpperCase();
    return two.length > 0 ? two : '?';
  });

  constructor() {
    this.identity.syncFromStorage();
    this.claims.syncFromAccessToken();
  }

  toggleDarkMode(): void {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      darkTheme: !state.darkTheme,
    }));
  }

  onLogout(popover: Popover): void {
    popover.hide();
    this.logoutPending.set(true);
    this.auth.logout().subscribe({
      next: () => {
        this.logoutPending.set(false);
        void this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: () => {
        this.logoutPending.set(false);
        this.identity.clear();
        this.claims.clear();
        void this.router.navigate(['/login'], { replaceUrl: true });
      },
    });
  }
}
