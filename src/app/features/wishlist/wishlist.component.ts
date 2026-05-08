// ══════════════════════════════════════════════════
// WISHLIST COMPONENT
// ══════════════════════════════════════════════════
import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WishlistApiService, CartApiService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Wishlist } from '../../shared/models/models';

// @Component — exported from wishlist.component.ts separately
export { WishlistComponent };

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-hero">
      <div class="container"><h1>My <span style="color:var(--gold)">Wishlist</span></h1><p>Books you want to read next</p></div>
    </div>
    <div class="container" style="padding:60px 24px">
      @if (loading()) { <div class="flex-center" style="padding:80px"><div class="spinner"></div></div>
      } @else if (wishlist()?.items?.length) {
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">
          <h3>{{ wishlist()!.totalItems }} saved book{{ wishlist()!.totalItems !== 1 ? 's' : '' }}</h3>
          <button class="btn btn-danger btn-sm" (click)="clearAll()">🗑️ Clear All</button>
        </div>
        <div class="grid-4 stagger">
          @for (item of wishlist()!.items; track item.itemId) {
            <div class="wishlist-card">
              <img [src]="item.coverImageUrl || 'assets/images/book-placeholder.png'" [alt]="item.bookTitle" onerror="this.src='assets/images/book-placeholder.png'">
              <div class="wishlist-info">
                <h4>{{ item.bookTitle }}</h4>
                <p>{{ item.author }}</p>
                @if (item.bookPrice) { <p class="price">₹{{ item.bookPrice | number:'1.0-0' }}</p> }
              </div>
              <div class="wishlist-actions">
                <button class="btn btn-primary btn-sm btn-full" (click)="addToCart(item)">🛒 Add to Cart</button>
                <button class="btn btn-secondary btn-sm btn-full" (click)="remove(item.itemId)">Remove</button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">❤️</div>
          <h3>Your wishlist is empty</h3>
          <p>Browse books and save your favourites for later.</p>
          <a routerLink="/books" class="btn btn-primary">Browse Books</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-hero { background: linear-gradient(135deg,var(--navy),var(--navy-mid)); padding:100px 0 60px; h1{color:white} p{color:rgba(255,255,255,0.65)} }
    .wishlist-card { background:white; border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-sm); transition:var(--transition); display:flex; flex-direction:column; &:hover{box-shadow:var(--shadow-md);transform:translateY(-4px)} img{width:100%;aspect-ratio:3/4;object-fit:cover} }
    .wishlist-info { padding:14px; flex:1; h4{font-size:0.95rem;margin-bottom:4px;} p{font-size:0.8rem;color:var(--text-light)} .price{font-family:var(--font-display);font-weight:700;color:var(--navy);font-size:1rem;margin-top:6px} }
    .wishlist-actions { padding:12px 14px; display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--cream-dark); }
  `]
})
class WishlistComponent implements OnInit {
  wishlistApi = inject(WishlistApiService);
  cartApi     = inject(CartApiService);
  auth        = inject(AuthService);
  toast       = inject(ToastService);
  wishlist    = signal<Wishlist | null>(null);
  loading     = signal(true);

  ngOnInit() {
    this.wishlistApi.get(this.auth.getUserId()).subscribe({ next: w => { this.wishlist.set(w); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  remove(itemId: number) {
    this.wishlistApi.remove(this.auth.getUserId(), itemId).subscribe({ next: w => { this.wishlist.set(w); this.toast.success('Removed from wishlist'); }, error: () => this.toast.error('Failed') });
  }

  addToCart(item: any) {
    this.cartApi.addItem(this.auth.getUserId(), {
      bookId: item.bookId,
      bookTitle: item.bookTitle,
      price: item.bookPrice || 0,
      quantity: 1,
      coverImageUrl: item.coverImageUrl
    }).subscribe({
      next: () => {
        this.wishlistApi.remove(this.auth.getUserId(), item.itemId).subscribe({
          next: wishlist => this.wishlist.set(wishlist),
          error: () => {}
        });
        this.toast.success('Moved to cart');
      },
      error: () => this.toast.error('Failed to add to cart')
    });
  }

  clearAll() {
    this.wishlistApi.clear(this.auth.getUserId()).subscribe({ next: () => { this.wishlist.update(w => w ? {...w, items:[], totalItems:0} : null); this.toast.success('Wishlist cleared'); }, error: () => this.toast.error('Failed') });
  }
}
