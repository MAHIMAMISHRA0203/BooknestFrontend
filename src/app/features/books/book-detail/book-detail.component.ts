import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookApiService, CartApiService, WishlistApiService, ReviewApiService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Book, Review, RatingSummary } from '../../../shared/models/models';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss']
})
export class BookDetailComponent implements OnInit {
  route       = inject(ActivatedRoute);
  bookApi     = inject(BookApiService);
  cartApi     = inject(CartApiService);
  wishlistApi = inject(WishlistApiService);
  reviewApi   = inject(ReviewApiService);
  auth        = inject(AuthService);
  toast       = inject(ToastService);

  book        = signal<Book | null>(null);
  reviews     = signal<Review[]>([]);
  summary     = signal<RatingSummary | null>(null);
  loading     = signal(true);
  quantity    = signal(1);

  // Review form
  showReviewForm = signal(false);
  reviewRating   = signal(5);
  reviewComment  = signal('');
  submittingReview = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.bookApi.getById(id).subscribe({
      next: b => { this.book.set(b); this.loadReviews(id); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadReviews(id: number) {
    this.reviewApi.getByBook(id).subscribe({ next: r => this.reviews.set(r), error: () => {} });
    this.reviewApi.getSummary(id).subscribe({ next: s => this.summary.set(s), error: () => {} });
  }

  addToCart() {
    if (!this.auth.isLoggedIn()) { this.toast.info('Please login to add to cart'); return; }
    const b = this.book()!;
    this.cartApi.addItem(this.auth.getUserId(), {
      bookId: b.bookId, bookTitle: b.title,
      price: b.price, quantity: this.quantity(),
      coverImageUrl: b.coverImageUrl
    }).subscribe({
      next: () => this.toast.success(`Added ${this.quantity()} copy to cart!`),
      error: () => this.toast.error('Failed to add to cart')
    });
  }

  addToWishlist() {
    if (!this.auth.isLoggedIn()) { this.toast.info('Please login first'); return; }
    const b = this.book()!;
    this.wishlistApi.add(this.auth.getUserId(), {
      bookId: b.bookId, bookTitle: b.title,
      author: b.author, bookPrice: b.price,
      coverImageUrl: b.coverImageUrl
    }).subscribe({
      next: () => this.toast.success('Added to wishlist!'),
      error: (e) => this.toast.error(e?.error?.message || 'Already in wishlist')
    });
  }

  submitReview() {
    if (!this.auth.isLoggedIn()) { this.toast.info('Please login to review'); return; }
    this.submittingReview.set(true);
    const b = this.book()!;
    this.reviewApi.add({
      bookId: b.bookId,
      userId: this.auth.getUserId(),
      userName: this.auth.currentUser()?.fullName || 'User',
      rating: this.reviewRating(),
      comment: this.reviewComment()
    }).subscribe({
      next: (r) => {
        this.reviews.update(rv => [r, ...rv]);
        this.showReviewForm.set(false);
        this.reviewComment.set('');
        this.toast.success('Review submitted!');
        this.submittingReview.set(false);
        this.loadReviews(b.bookId);
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to submit review');
        this.submittingReview.set(false);
      }
    });
  }

  getStars(n: number): string[] { return Array.from({length:5},(_,i)=>i<Math.round(n)?'★':'☆'); }
  adjustQty(d: number) { this.quantity.update(q => Math.max(1, Math.min(q+d, this.book()?.stock||99))); }
  toggleReviewForm() { this.showReviewForm.set(!this.showReviewForm()); }
}
