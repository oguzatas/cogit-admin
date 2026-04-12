import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '@/app/core/api/services/auth.service';
import { ADMIN_DEFAULT_URL } from '@/app/core/auth/auth-navigation';
import { sanitizeReturnUrl } from '@/app/core/auth/sanitize-return-url';
import { AppFloatingConfigurator } from '@/app/layout/component/app.floatingconfigurator';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    AppFloatingConfigurator,
  ],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    this.errorMessage.set(null);
    const email = this.email.trim();
    const password = this.password;
    if (!email || !password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }
    this.submitting.set(true);
    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.submitting.set(false);
        const next =
          sanitizeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')) ??
          ADMIN_DEFAULT_URL;
        void this.router.navigateByUrl(next, { replaceUrl: true });
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        if (err instanceof HttpErrorResponse) {
          const body = err.error as { message?: string } | string | null;
          const msg =
            typeof body === 'object' && body && 'message' in body && body.message
              ? String(body.message)
              : err.status === 401
                ? 'Invalid email or password.'
                : 'Sign-in failed. Please try again.';
          this.errorMessage.set(msg);
        } else {
          this.errorMessage.set('Sign-in failed. Please try again.');
        }
      },
    });
  }
}
