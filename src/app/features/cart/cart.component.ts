import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartApiService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Cart, CartItem } from '../../shared/models/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-hero">
      <div class="container">
        <h1>Shopping <span class="hero-accent">Cart</span></h1>
        <p>Review your items before checkout</p>
      </div>
    </div>

    <div class="container" style="padding:60px 24px">
      @if (loading()) {
        <div class="flex-center" style="padding:80px"><div class="spinner"></div></div>
      } @else if (cart()?.items?.length) {
        <div class="cart-layout">
          <!-- Items -->
          <div class="cart-items">
            <div class="cart-header">
              <h3>{{ cart()!.totalItems }} Item{{ cart()!.totalItems !== 1 ? 's' : '' }}</h3>
              <button class="btn btn-danger btn-sm" (click)="clearCart()">🗑️ Clear All</button>
            </div>

            @for (item of cart()!.items; track item.itemId) {
              <div class="cart-item">
                <img [src]="item.coverImageUrl || 'assets/images/book-placeholder.png'"
                     [alt]="item.bookTitle"
                     onerror="this.src='assets/images/book-placeholder.png'">
                <div class="item-info">
                  <h4>{{ item.bookTitle }}</h4>
                  <p class="item-price">₹{{ item.price | number:'1.0-0' }} each</p>
                </div>
                <div class="item-controls">
                  <div class="qty-control">
                    <button (click)="updateQty(item, -1)" [disabled]="item.quantity === 1">−</button>
                    <span>{{ item.quantity }}</span>
                    <button (click)="updateQty(item, 1)">+</button>
                  </div>
                  <span class="item-subtotal">₹{{ item.subtotal | number:'1.0-0' }}</span>
                  <button class="remove-btn" (click)="removeItem(item.itemId)" title="Remove">✕</button>
                </div>
              </div>
            }
          </div>

          <!-- Summary -->
          <div class="cart-summary">
            <div class="summary-card">
              <h3>Order Summary</h3>
              <div class="summary-rows">
                <div class="summary-row">
                  <span>Subtotal ({{ cart()!.totalItems }} items)</span>
                  <span>₹{{ cart()!.totalPrice | number:'1.0-0' }}</span>
                </div>
                <div class="summary-row">
                  <span>Delivery</span>
                  <span class="text-success">FREE</span>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-row total">
                  <strong>Total</strong>
                  <strong>₹{{ cart()!.totalPrice | number:'1.0-0' }}</strong>
                </div>
              </div>
              <a routerLink="/checkout" class="btn btn-primary btn-full btn-lg" style="margin-top:24px">
                Proceed to Checkout →
              </a>
              <a routerLink="/books" class="btn btn-secondary btn-full" style="margin-top:12px">
                ← Continue Shopping
              </a>
            </div>

            <div class="trust-badges">
              <div class="trust-item">🔒 Secure Checkout</div>
              <div class="trust-item">📦 Free Delivery</div>
              <div class="trust-item">↩️ Easy Returns</div>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any books yet.</p>
          <a routerLink="/books" class="btn btn-primary">Browse Books</a>
        </div>
      }
    </div>
  `,
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartApi = inject(CartApiService);
  auth    = inject(AuthService);
  toast   = inject(ToastService);

  cart    = signal<Cart | null>(null);
  loading = signal(true);

  ngOnInit() { this.loadCart(); }

  loadCart() {
    this.cartApi.getCart(this.auth.getUserId()).subscribe({
      next: c => { this.cart.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  updateQty(item: CartItem, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    this.cartApi.updateQuantity(this.auth.getUserId(), item.itemId, newQty)
      .subscribe({ next: c => this.cart.set(c), error: () => this.toast.error('Update failed') });
  }

  removeItem(itemId: number) {
    this.cartApi.removeItem(this.auth.getUserId(), itemId)
      .subscribe({ next: c => { this.cart.set(c); this.toast.success('Item removed'); }, error: () => this.toast.error('Failed to remove') });
  }

  clearCart() {
    this.cartApi.clearCart(this.auth.getUserId())
      .subscribe({ next: () => { this.loadCart(); this.toast.success('Cart cleared'); }, error: () => this.toast.error('Failed to clear') });
  }
}
