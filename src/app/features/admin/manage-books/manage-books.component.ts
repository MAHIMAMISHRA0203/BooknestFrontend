// ══════════════════════════════════════════════════
// ADMIN: MANAGE BOOKS
// ══════════════════════════════════════════════════
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookApiService, OrderApiService, ReviewApiService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Book, Order, Review } from '../../../shared/models/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export { ManageBooksComponent, ManageOrdersComponent, ManageUsersComponent, ManageReviewsComponent };

// ── MANAGE BOOKS ─────────────────────────────────────────
@Component({ selector:'app-manage-books', standalone:true, imports:[CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="admin-section">
      <div class="admin-section-header">
        <h2>📚 Manage Books</h2>
        <button class="btn btn-primary" (click)="openAddModal()">+ Add New Book</button>
      </div>

      <div class="admin-table-wrap">
        <input
          type="text"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
          placeholder="Search books..."
          class="form-control table-search">
        @if (loading()) { <div class="flex-center" style="padding:60px"><div class="spinner"></div></div>
        } @else {
          <table class="admin-table">
            <thead><tr><th>Cover</th><th>Title</th><th>Author</th><th>Genre</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead>
            <tbody>
              @for (b of filteredBooks(); track b.bookId) {
                <tr>
                  <td><img [src]="b.coverImageUrl || placeholderCover" [alt]="b.title" class="table-cover" (error)="onCoverError($event)"></td>
                  <td><strong>{{ b.title }}</strong></td>
                  <td>{{ b.author }}</td>
                  <td><span class="badge badge-gold">{{ b.genre }}</span></td>
                  <td>₹{{ b.price }}</td>
                  <td>
                    <span [ngClass]="b.stock>5?'badge-success':b.stock>0?'badge-warning':'badge-error'" class="badge">{{ b.stock }}</span>
                  </td>
                  <td>⭐ {{ b.rating | number:'1.1-1' }}</td>
                  <td class="table-actions">
                    <button class="btn btn-outline-gold btn-sm" (click)="editBook(b)">Edit</button>
                    <button class="btn btn-danger btn-sm" (click)="deleteBook(b.bookId)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Add/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editing() ? 'Edit Book' : 'Add New Book' }}</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="bookForm">
                <div class="grid-2">
                  <div class="form-group"><label>Title *</label><input formControlName="title" class="form-control" placeholder="Book title"></div>
                  <div class="form-group"><label>Author *</label><input formControlName="author" class="form-control" placeholder="Author name"></div>
                  <div class="form-group"><label>Genre *</label>
                    <select formControlName="genre" class="form-control">
                      @for (g of genres; track g) { <option [value]="g">{{ g }}</option> }
                    </select>
                  </div>
                  <div class="form-group"><label>ISBN</label><input formControlName="isbn" class="form-control" placeholder="ISBN"></div>
                  <div class="form-group"><label>Price (₹) *</label><input type="number" formControlName="price" class="form-control"></div>
                  <div class="form-group"><label>Stock *</label><input type="number" formControlName="stock" class="form-control"></div>
                  <div class="form-group" style="grid-column:1/-1"><label>Publisher</label><input formControlName="publisher" class="form-control"></div>
                  <div class="form-group" style="grid-column:1/-1"><label>Cover Image URL</label><input formControlName="coverImageUrl" class="form-control" placeholder="https://..."></div>
                  <div class="form-group" style="grid-column:1/-1"><label>Description</label><textarea formControlName="description" class="form-control" rows="3" placeholder="Book description..."></textarea></div>
                </div>
                <div class="form-group">
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                    <input type="checkbox" formControlName="featured"> Mark as Featured
                  </label>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button class="btn btn-primary" (click)="saveBook()" [disabled]="saving()">
                @if (saving()) { <span class="spinner spinner-sm"></span> }
                {{ editing() ? 'Update Book' : 'Add Book' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `, styleUrls: ['./admin.shared.scss']
})
class ManageBooksComponent implements OnInit {
  bookApi = inject(BookApiService);
   toast = inject(ToastService);
    fb = inject(FormBuilder);
  books = signal<Book[]>([]);
  readonly placeholderCover = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="54"><rect width="100%25" height="100%25" fill="%23e8e1d4"/><text x="50%25" y="52%25" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="%23847456">No Cover</text></svg>';
  loading = signal(true);
   saving = signal(false);
  showModal = signal(false);
  editing = signal(false);
  editingId = signal(0);
  search = signal('');
   genres = ['Fiction','Non-Fiction','Technology','Science','History','Biography','Self Help','Romance','Mystery','Fantasy','Children'];

  bookForm = this.fb.group({ title:['',Validators.required],
      author:['',Validators.required], isbn:[''], genre:['Fiction',Validators.required], publisher:[''], price:[0,[Validators.required,Validators.min(1)]], stock:[0,[Validators.required,Validators.min(0)]], description:[''], coverImageUrl:[''], featured:[false] });

  ngOnInit() { this.bookApi.getAll().subscribe({ next:b=>{ this.books.set(b); this.loading.set(false); }, error:()=>this.loading.set(false) }); }

  filteredBooks = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.books();
    }
    return this.books().filter(
      b =>
        b.title.toLowerCase().includes(term) ||
        b.author.toLowerCase().includes(term)
    );
  });

  openAddModal() { this.bookForm.reset({genre:'Fiction',price:0,stock:0,featured:false}); this.editing.set(false); this.showModal.set(true); }
  editBook(b: Book) { this.bookForm.patchValue(b as any); this.editing.set(true); this.editingId.set(b.bookId); this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  saveBook() {
    if (this.bookForm.invalid) { this.bookForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = this.bookForm.value as any;
    const obs = this.editing() ? this.bookApi.update(this.editingId(), data) : this.bookApi.create(data);
    obs.subscribe({
      next: b => { this.editing() ? this.books.update(list=>list.map(x=>x.bookId===b.bookId?b:x)) : this.books.update(list=>[b,...list]); this.toast.success(this.editing()?'Book updated!':'Book added!'); this.closeModal(); this.saving.set(false); },
      error: () => { this.toast.error('Save failed'); this.saving.set(false); }
    });
  }

  deleteBook(id: number) {
    if (!confirm('Delete this book?')) return;
    this.bookApi.delete(id).subscribe({ next:()=>{ this.books.update(list=>list.filter(b=>b.bookId!==id)); this.toast.success('Book deleted'); }, error:()=>this.toast.error('Delete failed') });
  }

  onCoverError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    img.onerror = null;
    img.src = this.placeholderCover;
  }
}

// ── MANAGE ORDERS ─────────────────────────────────────────
@Component({ selector:'app-manage-orders', standalone:true, imports:[CommonModule, FormsModule],
  template: `
    <div class="admin-section">
      <div class="admin-section-header"><h2>📦 Manage Orders</h2></div>
      <div class="admin-table-wrap">
        <div style="display:flex;gap:12px;margin-bottom:16px">
          <input type="text" [(ngModel)]="search" placeholder="Search by invoice or user ID..." class="form-control" style="max-width:320px">
          <select [(ngModel)]="filterStatus" class="form-control" style="width:auto">
            <option value="">All Statuses</option>
            @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
          </select>
        </div>
        @if (loading()) { <div class="flex-center" style="padding:60px"><div class="spinner"></div></div>
        } @else {
          <table class="admin-table">
            <thead><tr><th>Invoice</th><th>User ID</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>
              @for (o of filteredOrders(); track o.orderId) {
                <tr>
                  <td><strong>{{ o.invoiceNumber }}</strong></td>
                  <td>{{ o.userId }}</td>
                  <td>{{ o.orderDate | date:'shortDate' }}</td>
                  <td><strong>₹{{ o.amountPaid | number:'1.0-0' }}</strong></td>
                  <td>{{ o.modeOfPayment }}</td>
                  <td><span class="badge" [ngClass]="getStatusClass(o.orderStatus)">{{ o.orderStatus }}</span></td>
                  <td>
                    <select class="form-control" style="width:auto;padding:6px 10px;font-size:0.8rem"
                            [value]="o.orderStatus" (change)="updateStatus(o.orderId, $any($event.target).value)">
                      @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `, styleUrls: ['./admin.shared.scss']
})
class ManageOrdersComponent implements OnInit {
  orderApi = inject(OrderApiService); toast = inject(ToastService);
  orders = signal<Order[]>([]); loading = signal(true);
  search = ''; filterStatus = '';
  statuses = ['PLACED','CONFIRMED','DISPATCHED','DELIVERED','CANCELLED'];

  ngOnInit() { this.orderApi.getAll().subscribe({ next:o=>{ this.orders.set(o); this.loading.set(false); }, error:()=>this.loading.set(false) }); }

  filteredOrders() {
    return this.orders().filter(o => {
      const matchSearch =
        !this.search ||
        o.invoiceNumber?.toLowerCase().includes(this.search.toLowerCase()) ||
        o.userId?.toString().includes(this.search);
      const matchStatus = !this.filterStatus || o.orderStatus === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  updateStatus(id: number, status: string) {
    this.orderApi.changeStatus(id, status).subscribe({ next:updated=>{ this.orders.update(list=>list.map(o=>o.orderId===id?updated:o)); this.toast.success(`Order updated to ${status}`); }, error:()=>this.toast.error('Update failed') });
  }

  getStatusClass(s: string) { const m:any={PLACED:'badge-info',CONFIRMED:'badge-warning',DISPATCHED:'badge-gold',DELIVERED:'badge-success',CANCELLED:'badge-error'}; return m[s]||'badge-info'; }
}

// ── MANAGE USERS ─────────────────────────────────────────
@Component({ selector:'app-manage-users', standalone:true, imports:[CommonModule, FormsModule],
  template: `
    <div class="admin-section">
      <div class="admin-section-header"><h2>👥 Manage Users</h2></div>
      <div class="admin-table-wrap">
        <input type="text" [(ngModel)]="search" placeholder="Search users..." class="form-control table-search">
        @if (loading()) { <div class="flex-center" style="padding:60px"><div class="spinner"></div></div>
        } @else {
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              @for (u of filteredUsers(); track u.userId) {
                <tr>
                  <td>#{{ u.userId }}</td>
                  <td><strong>{{ u.fullName }}</strong></td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.mobile || '—' }}</td>
                  <td><span class="badge" [ngClass]="u.active?'badge-success':'badge-error'">{{ u.active ? 'Active' : 'Suspended' }}</span></td>
                  <td class="table-actions">
                    @if (u.active) { <button class="btn btn-warning btn-sm" (click)="suspendUser(u.userId)">Suspend</button>
                    } @else        { <button class="btn btn-success btn-sm" (click)="activateUser(u.userId)">Activate</button> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `, styleUrls: ['./admin.shared.scss']
})
class ManageUsersComponent implements OnInit {
  http = inject(HttpClient); auth = inject(AuthService); toast = inject(ToastService);
  users = signal<any[]>([]); loading = signal(true); search = '';

  ngOnInit() { this.http.get<any[]>(`${environment.apiUrl}/auth/admin/customers`).subscribe({ next:u=>{ this.users.set(u); this.loading.set(false); }, error:()=>this.loading.set(false) }); }

  filteredUsers() {
    return this.users().filter(
      u =>
        !this.search ||
        u.fullName?.toLowerCase().includes(this.search.toLowerCase()) ||
        u.email?.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  suspendUser(id: number) { this.http.put(`${environment.apiUrl}/auth/admin/suspend/${id}`,{}).subscribe({ next:()=>{ this.users.update(list=>list.map(u=>u.userId===id?{...u,active:false}:u)); this.toast.success('User suspended'); }, error:()=>this.toast.error('Failed') }); }
  activateUser(id: number) { this.http.put(`${environment.apiUrl}/auth/admin/activate/${id}`,{}).subscribe({ next:()=>{ this.users.update(list=>list.map(u=>u.userId===id?{...u,active:true}:u)); this.toast.success('User activated'); }, error:()=>this.toast.error('Failed') }); }
}

// ── MANAGE REVIEWS ─────────────────────────────────────────
@Component({ selector:'app-manage-reviews', standalone:true, imports:[CommonModule, FormsModule],
  template: `
    <div class="admin-section">
      <div class="admin-section-header"><h2>⭐ Moderate Reviews</h2></div>
      <div class="admin-table-wrap">
        <input type="text" [(ngModel)]="search" placeholder="Search reviews..." class="form-control table-search">
        @if (loading()) { <div class="flex-center" style="padding:60px"><div class="spinner"></div></div>
        } @else {
          <table class="admin-table">
            <thead><tr><th>Book ID</th><th>User</th><th>Rating</th><th>Comment</th><th>Date</th><th>Verified</th><th>Actions</th></tr></thead>
            <tbody>
              @for (r of filteredReviews(); track r.reviewId) {
                <tr>
                  <td>#{{ r.bookId }}</td>
                  <td>{{ r.userName }}</td>
                  <td>
                    <div style="display:flex;gap:2px">
                      @for (s of getStars(r.rating); track $index) {
                        <span [style.color]="s==='★'?'var(--gold)':'var(--cream-dark)'">{{ s }}</span>
                      }
                    </div>
                  </td>
                  <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.comment || '—' }}</td>
                  <td>{{ r.reviewDate | date:'shortDate' }}</td>
                  <td><span class="badge" [ngClass]="r.verified?'badge-success':'badge-warning'">{{ r.verified ? 'Verified' : 'Unverified' }}</span></td>
                  <td>
                    <button class="btn btn-danger btn-sm" (click)="deleteReview(r.reviewId)">Remove</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `, styleUrls: ['./admin.shared.scss']
})
class ManageReviewsComponent implements OnInit {
  reviewApi = inject(ReviewApiService); toast = inject(ToastService);
  reviews = signal<Review[]>([]); loading = signal(true); search = '';

  ngOnInit() { this.reviewApi.getAll().subscribe({ next:r=>{ this.reviews.set(r); this.loading.set(false); }, error:()=>this.loading.set(false) }); }

  filteredReviews() {
    return this.reviews().filter(
      r =>
        !this.search ||
        r.userName?.toLowerCase().includes(this.search.toLowerCase()) ||
        r.comment?.toLowerCase().includes(this.search.toLowerCase())
    );
  }

  deleteReview(id: number) {
    if (!confirm('Remove this review?')) return;
    this.reviewApi.delete(id).subscribe({ next:()=>{ this.reviews.update(list=>list.filter(r=>r.reviewId!==id)); this.toast.success('Review removed'); }, error:()=>this.toast.error('Failed') });
  }

  getStars(n: number): string[] { return Array.from({length:5},(_,i)=>i<Math.round(n)?'★':'☆'); }
}
