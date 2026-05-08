import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-left-content">
          <h1>Join <span>BookNest</span><br>Today</h1>
          <p>Start your reading journey with thousands of books, personalised recommendations, and a community of readers.</p>
          <div class="auth-features">
            <div class="feature">🎁 Free account forever</div>
            <div class="feature">📚 Unlimited browsing</div>
            <div class="feature">💳 Secure e-wallet payments</div>
            <div class="feature">⭐ Rate and review books</div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-header">
            <a routerLink="/" class="auth-logo">📚 BookNest</a>
            <h2>Create Account</h2>
            <p>Already have an account? <a routerLink="/login">Sign in</a></p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" formControlName="fullName" class="form-control"
                     placeholder="John Doe"
                     [class.error]="form.get('fullName')?.invalid && form.get('fullName')?.touched">
              @if (form.get('fullName')?.invalid && form.get('fullName')?.touched) {
                <span class="form-error">Full name is required</span>
              }
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input type="email" formControlName="email" class="form-control"
                     placeholder="your@email.com"
                     [class.error]="form.get('email')?.invalid && form.get('email')?.touched">
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="form-error">Valid email is required</span>
              }
            </div>

            <div class="form-group">
              <label>Mobile Number <span style="color:var(--text-light)">(optional)</span></label>
              <input type="tel" formControlName="mobile" class="form-control" placeholder="9999999999">
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="input-with-icon">
                <input [type]="showPassword() ? 'text' : 'password'"
                       formControlName="password" class="form-control"
                       placeholder="At least 6 characters"
                       [class.error]="form.get('password')?.invalid && form.get('password')?.touched">
                <button type="button" class="toggle-password" (click)="togglePassword()">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <span class="form-error">Password must be at least 6 characters</span>
              }
            </div>

            @if (errorMsg()) {
              <div class="auth-error">❌ {{ errorMsg() }}</div>
            }

            <button type="submit" class="btn btn-primary btn-full btn-lg"
                    [disabled]="loading() || form.invalid">
              @if (loading()) { <span class="spinner spinner-sm"></span> }
              {{ loading() ? 'Creating account...' : 'Create Free Account' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../login/auth.shared.scss']
})
export class RegisterComponent {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);

  loading = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    fullName: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    mobile:   [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.register(this.form.value as any).pipe(
      timeout(15000),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.toast.success('Account created! Welcome to BookNest 🎉');
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.errorMsg.set(e?.name === 'TimeoutError'
          ? 'Backend did not respond. Please make sure services are running and try again.'
          : (e?.error?.message || 'Registration failed. Please try again.'));
      }
    });
  }
}
