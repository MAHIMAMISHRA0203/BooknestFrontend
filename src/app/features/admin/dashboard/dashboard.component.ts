import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderApiService, BookApiService } from '../../../core/services/api.services';
import { Analytics, Book, Order } from '../../../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="admin-header">
        <h1>Admin <span style="color:var(--gold)">Dashboard</span></h1>
        <p>BookNest Platform Overview</p>
      </div>

      <div class="container" style="padding-bottom:80px">
        <!-- Stats -->
        <div class="stats-grid stagger">
          <div class="stat-card navy">
            <div class="stat-icon">📦</div>
            <div class="stat-body">
              <span class="stat-label">Total Orders</span>
              <span class="stat-value">{{ analytics()?.totalOrders || 0 }}</span>
            </div>
          </div>
          <div class="stat-card gold">
            <div class="stat-icon">💰</div>
            <div class="stat-body">
              <span class="stat-label">Total Revenue</span>
              <span class="stat-value">₹{{ analytics()?.totalRevenue | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-body">
              <span class="stat-label">Delivered</span>
              <span class="stat-value">{{ analytics()?.deliveredOrders || 0 }}</span>
            </div>
          </div>
          <div class="stat-card warning">
            <div class="stat-icon">🔄</div>
            <div class="stat-body">
              <span class="stat-label">Pending</span>
              <span class="stat-value">{{ analytics()?.pendingOrders || 0 }}</span>
            </div>
          </div>
          <div class="stat-card danger">
            <div class="stat-icon">❌</div>
            <div class="stat-body">
              <span class="stat-label">Cancelled</span>
              <span class="stat-value">{{ analytics()?.cancelledOrders || 0 }}</span>
            </div>
          </div>
          <div class="stat-card info">
            <div class="stat-icon">📚</div>
            <div class="stat-body">
              <span class="stat-label">Total Books</span>
              <span class="stat-value">{{ totalBooks() }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="quick-links">
          <h3 style="margin-bottom:24px">Quick Actions</h3>
          <div class="grid-4">
            <a routerLink="/admin/books" class="quick-link-card">
              <span class="ql-icon">📚</span>
              <strong>Manage Books</strong>
              <p>Add, edit, delete books & manage inventory</p>
            </a>
            <a routerLink="/admin/orders" class="quick-link-card">
              <span class="ql-icon">📦</span>
              <strong>Manage Orders</strong>
              <p>View and update all customer orders</p>
            </a>
            <a routerLink="/admin/users" class="quick-link-card">
              <span class="ql-icon">👥</span>
              <strong>Manage Users</strong>
              <p>View and manage customer accounts</p>
            </a>
            <a routerLink="/admin/reviews" class="quick-link-card">
              <span class="ql-icon">⭐</span>
              <strong>Moderate Reviews</strong>
              <p>Approve or remove customer reviews</p>
            </a>
          </div>
        </div>

        <div class="insights-grid">
          <div class="card">
            <div class="card-header"><h3>Top Selling Books</h3></div>
            <div class="card-body">
              @if (topBooks().length) {
                <ol class="insight-list">
                  @for (item of topBooks(); track item.bookId) {
                    <li>
                      <span>{{ item.title }}</span>
                      <strong>{{ item.quantity }}</strong>
                    </li>
                  }
                </ol>
              } @else {
                <p>No sales data yet.</p>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Category Breakdown</h3></div>
            <div class="card-body">
              @if (categoryBreakdown().length) {
                <ul class="insight-list">
                  @for (item of categoryBreakdown(); track item.genre) {
                    <li>
                      <span>{{ item.genre }}</span>
                      <strong>{{ item.quantity }}</strong>
                    </li>
                  }
                </ul>
              } @else {
                <p>No category data yet.</p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss'],
  styles: [`
    .insights-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:28px; }
    .insight-list { display:grid; gap:10px; list-style:none; padding:0; margin:0; }
    .insight-list li { display:flex; align-items:center; justify-content:space-between; border:1px solid var(--cream-dark); border-radius:8px; padding:10px 12px; }
    .insight-list li span { color:var(--text-mid); font-size:0.9rem; }
    @media (max-width: 900px) { .insights-grid { grid-template-columns:1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  orderApi = inject(OrderApiService);
  bookApi  = inject(BookApiService);
  analytics = signal<Analytics | null>(null);
  totalBooks = signal(0);
  allOrders = signal<Order[]>([]);
  allBooks = signal<Book[]>([]);

  ngOnInit() {
    this.orderApi.getAnalytics().subscribe({ next: a => this.analytics.set(a), error: () => {} });
    this.bookApi.getAll().subscribe({
      next: books => {
        this.totalBooks.set(books.length);
        this.allBooks.set(books);
        this.recomputeInsights();
      },
      error: () => {}
    });
    this.orderApi.getAll().subscribe({
      next: orders => {
        this.allOrders.set(orders);
        this.recomputeInsights();
      },
      error: () => {}
    });
  }

  topBooks = signal<{ bookId: number; title: string; quantity: number }[]>([]);
  categoryBreakdown = signal<{ genre: string; quantity: number }[]>([]);

  private recomputeInsights(): void {
    const titleByBookId = new Map<number, string>();
    const genreByBookId = new Map<number, string>();
    this.allBooks().forEach(book => {
      titleByBookId.set(book.bookId, book.title);
      genreByBookId.set(book.bookId, book.genre || 'Unknown');
    });

    const byBook = new Map<number, number>();
    const byGenre = new Map<string, number>();
    this.allOrders().forEach(order => {
      order.items.forEach(item => {
        byBook.set(item.bookId, (byBook.get(item.bookId) || 0) + item.quantity);
        const genre = genreByBookId.get(item.bookId) || 'Unknown';
        byGenre.set(genre, (byGenre.get(genre) || 0) + item.quantity);
      });
    });

    this.topBooks.set(
      [...byBook.entries()]
        .map(([bookId, quantity]) => ({ bookId, quantity, title: titleByBookId.get(bookId) || `Book #${bookId}` }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
    );

    this.categoryBreakdown.set(
      [...byGenre.entries()]
        .map(([genre, quantity]) => ({ genre, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
    );
  }
}
