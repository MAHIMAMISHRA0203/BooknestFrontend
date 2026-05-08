import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-left-content">
          <h1>Welcome<br>Back, <span>Reader</span></h1>
          <p>Your next adventure is waiting. Log in to access your books, orders, and reading list.</p>
          <div class="auth-features">
            <div class="feature"> Track your orders</div>
            <div class="feature">Access your wishlist</div>
            <div class="feature"> Manage your wallet</div>
            <div class="feature">Leave reviews</div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-header">
            <a routerLink="/" class="auth-logo">BookNest</a>
            <h2>Sign In</h2>
            <p>Don't have an account? <a routerLink="/register">Create one free</a></p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" formControlName="email"
                     class="form-control" placeholder="your@email.com"
                     [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="form-error">Please enter a valid email</span>
              }
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-with-icon">
                <input [type]="showPassword() ? 'text' : 'password'"
                       formControlName="password"
                       class="form-control" placeholder="Your password"
                       [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
                <button type="button" class="toggle-password" (click)="togglePassword()">
                  {{ showPassword() ? 'ðŸ™ˆ' : 'ðŸ‘ï¸' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="form-error">Password is required</span>
              }
            </div>

            @if (errorMsg()) {
              <div class="auth-error">âŒ {{ errorMsg() }}</div>
            }

            <button type="submit" class="btn btn-primary btn-full btn-lg"
                    [disabled]="loading() || form.invalid">
              @if (loading()) { <span class="spinner spinner-sm"></span> }
              {{ loading() ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="auth-divider"><span>or continue with</span></div>
          <a href="http://localhost:8080/oauth2/authorization/github" class="btn btn-secondary btn-full">
            ðŸ™ Continue with GitHub
          </a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./auth.shared.scss']
})
export class LoginComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  loading = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value as any).pipe(
      timeout(15000),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.toast.success('Welcome back! ðŸ‘‹');
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.errorMsg.set(e?.name === 'TimeoutError'
          ? 'Backend did not respond. Please make sure services are running and try again.'
          : (e?.error?.message || 'Invalid email or password'));
      }
    });
  }
}
