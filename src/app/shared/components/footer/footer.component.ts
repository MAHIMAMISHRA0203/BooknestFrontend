import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="brand-logo">Book<span>Nest</span></div>
            <p>Your premium destination for books. Discover worlds, one page at a time.</p>
          </div>
          <div class="footer-links">
            <h4>Browse</h4>
            <ul>
              <li><a routerLink="/books">All Books</a></li>
              <li><a routerLink="/books" [queryParams]="{genre:'Fiction'}">Fiction</a></li>
              <li><a routerLink="/books" [queryParams]="{genre:'Technology'}">Technology</a></li>
              <li><a routerLink="/books" [queryParams]="{featured:true}">Featured</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Account</h4>
            <ul>
              <li><a routerLink="/login">Login</a></li>
              <li><a routerLink="/register">Register</a></li>
              <li><a routerLink="/orders">My Orders</a></li>
              <li><a routerLink="/wallet">Wallet</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Returns Policy</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 BookNest. All rights reserved. Built for book lovers.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background:
        radial-gradient(circle at 12% 8%, rgba(201,168,76,0.2), transparent 26%),
        linear-gradient(160deg, #0c1626, #12233b 58%, #1b3250);
      color: rgba(255,255,255,0.72);
      padding: 64px 0 0;
      margin-top: 80px;
      border-top: 1px solid rgba(201,168,76,0.2);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 48px;
      padding-bottom: 48px;
      border-bottom: 1px solid rgba(255,255,255,0.14);
    }
    .brand-logo {
      font-family: var(--font-display);
      font-size: 1.7rem;
      font-weight: 700;
      color: #fefcf8;
      margin-bottom: 16px;
      letter-spacing: 0.3px;
      span { color: var(--gold); }
    }
    .footer-brand p { font-size: 0.9rem; line-height: 1.8; color: rgba(255,255,255,0.65); }
    .footer-links h4 {
      font-family: var(--font-display);
      color: #fdf8ef;
      font-size: 1.02rem;
      margin-bottom: 16px;
    }
    .footer-links ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .footer-links a {
      color: rgba(255,255,255,0.66);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
      &:hover { color: var(--gold-light); text-decoration: underline; text-underline-offset: 3px; }
    }
    .footer-bottom {
      padding: 24px 0;
      text-align: center;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.6);
    }
    @media (max-width: 768px) {
      .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
    }
    @media (max-width: 480px) {
      .footer-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class FooterComponent {}
