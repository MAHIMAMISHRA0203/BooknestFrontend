import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;

  currentUser = signal<UserProfile | null>(null);
  isLoggedIn  = signal<boolean>(false);
  isAdmin     = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, req).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, req).pipe(
      tap(res => this.saveSession(res))
    );
  }

  logout(): void {
    localStorage.clear();
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
    this.router.navigate(['/login']);
  }

  getProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/profile/${userId}`);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): number {
    return parseInt(localStorage.getItem('userId') || '0');
  }

  completeOAuthLogin(res: AuthResponse): void {
    this.saveSession(res);
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('userId', res.userId.toString());
    localStorage.setItem('fullName', res.fullName);
    localStorage.setItem('email', res.email);
    localStorage.setItem('role', res.role);

    this.isLoggedIn.set(true);
    this.isAdmin.set(res.role === 'ADMIN');
    this.currentUser.set({
      userId: res.userId, fullName: res.fullName,
      email: res.email, role: res.role,
      mobile: '', provider: 'LOCAL', active: true
    });
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoggedIn.set(true);
      this.isAdmin.set(localStorage.getItem('role') === 'ADMIN');
      this.currentUser.set({
        userId: parseInt(localStorage.getItem('userId') || '0'),
        fullName: localStorage.getItem('fullName') || '',
        email: localStorage.getItem('email') || '',
        role: localStorage.getItem('role') || '',
        mobile: '', provider: 'LOCAL', active: true
      });
    }
  }
}
