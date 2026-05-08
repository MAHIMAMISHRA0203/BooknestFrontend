import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Book } from '../../models/models';
import { AuthService } from '../../../core/services/auth.service';
import { CartApiService, WishlistApiService } from '../../../core/services/api.services';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="book-card">
      <div class="book-cover">
        <a [routerLink]="['/books', book.bookId]">
          <img [src]="book.coverImageUrl || 'assets/images/book-placeholder.png'"
               [alt]="book.title"
               onerror="this.src='assets/images/book-placeholder.png'">
        </a>
        @if (book.featured) { <span class="featured-badge">⭐ Featured</span> }
        @if (!book.inStock)  { <div class="out-of-stock-overlay">Out of Stock</div> }

        <div class="card-actions">
          <button class="action-btn" title="Add to Wishlist" (click)="addToWishlist()">❤️</button>
          <button class="action-btn primary" title="Add to Cart"
                  [disabled]="!book.inStock" (click)="addToCart()">🛒</button>
        </div>
      </div>

      <div class="book-info">
        <p class="book-genre">{{ book.genre }}</p>
        <h3 class="book-title">
          <a [routerLink]="['/books', book.bookId]">{{ book.title }}</a>
        </h3>
        <p class="book-author">by {{ book.author }}</p>
        <div class="book-footer">
          <div class="stars">
            @for (s of getStars(book.rating); track $index) {
              <span [class]="s === '★' ? 'star-filled' : 'star-empty'">{{ s }}</span>
            }
            <span class="rating-num">({{ book.rating | number:'1.1-1' }})</span>
          </div>
          <span class="price">₹{{ book.price | number:'1.0-0' }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./book-card.component.scss']
})
export class BookCardComponent {
  @Input({ required: true }) book!: Book;
  @Output() cartAdded = new EventEmitter<void>();

  auth = inject(AuthService);
  cartApi = inject(CartApiService);
  wishlistApi = inject(WishlistApiService);
  toast = inject(ToastService);

  getStars(rating: number): string[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆');
  }

  addToCart() {
    if (!this.auth.isLoggedIn()) { this.toast.info('Please login to add to cart'); return; }
    const userId = this.auth.getUserId();
    this.cartApi.addItem(userId, {
      bookId: this.book.bookId,
      bookTitle: this.book.title,
      price: this.book.price,
      quantity: 1,
      coverImageUrl: this.book.coverImageUrl
    }).subscribe({
      next: () => { this.toast.success(`"${this.book.title}" added to cart!`); this.cartAdded.emit(); },
      error: () => this.toast.error('Failed to add to cart')
    });
  }

  addToWishlist() {
    if (!this.auth.isLoggedIn()) { this.toast.info('Please login to save to wishlist'); return; }
    const userId = this.auth.getUserId();
    this.wishlistApi.add(userId, {
      bookId: this.book.bookId,
      bookTitle: this.book.title,
      author: this.book.author,
      bookPrice: this.book.price,
      coverImageUrl: this.book.coverImageUrl
    }).subscribe({
      next: () => this.toast.success('Added to wishlist!'),
      error: (e) => this.toast.error(e?.error?.message || 'Already in wishlist')
    });
  }
}
