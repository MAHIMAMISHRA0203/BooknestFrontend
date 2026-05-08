import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: routerSpy }]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores session on login', () => {
    service.login({ email: 'user@mail.com', password: 'secret123' }).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({
      token: 'jwt-token',
      refreshToken: 'refresh-token',
      userId: 12,
      fullName: 'Sample User',
      email: 'user@mail.com',
      role: 'CUSTOMER',
      message: 'ok'
    });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.getUserId()).toBe(12);
    expect(localStorage.getItem('token')).toBe('jwt-token');
  });

  it('logs out and redirects', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('userId', '12');
    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
