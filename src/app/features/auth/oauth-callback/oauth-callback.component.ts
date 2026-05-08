import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthResponse } from '../../../shared/models/models';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `<p style="padding:24px;text-align:center;">Signing you in with GitHub...</p>`
})
export class OauthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const userId = Number(params.get('userId') || '0');
    const fullName = params.get('fullName');
    const email = params.get('email');
    const role = params.get('role');

    if (!token || !refreshToken || !userId || !fullName || !email || !role) {
      this.toast.error('GitHub sign-in failed. Please try again.');
      this.router.navigate(['/login']);
      return;
    }

    const response: AuthResponse = {
      token,
      refreshToken,
      userId,
      fullName,
      email,
      role,
      message: 'Login successful'
    };

    this.auth.completeOAuthLogin(response);
    this.toast.success(`Welcome, ${fullName}!`);
    this.router.navigate(['/']);
  }
}
