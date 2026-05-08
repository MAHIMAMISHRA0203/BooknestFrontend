import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Book, BookRequest, Cart, Order, PlaceOrderRequest,
  PaymentIntentRequest, PaymentIntentResponse,
  Wallet, Statement, Review, RatingSummary,
  Notification, NotificationSummary, Wishlist, Analytics, Address
} from '../../shared/models/models';

const API = environment.apiUrl;

// ── Book Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BookApiService {
  private url = `${API}/books`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Book[]>                        { return this.http.get<Book[]>(this.url); }
  getById(id: number): Observable<Book>               { return this.http.get<Book>(`${this.url}/${id}`); }
  search(keyword: string): Observable<Book[]>         { return this.http.get<Book[]>(`${this.url}/search?keyword=${keyword}`); }
  getByGenre(genre: string): Observable<Book[]>       { return this.http.get<Book[]>(`${this.url}/genre/${genre}`); }
  getByAuthor(author: string): Observable<Book[]>     { return this.http.get<Book[]>(`${this.url}/author/${author}`); }
  getFeatured(): Observable<Book[]>                   { return this.http.get<Book[]>(`${this.url}/featured`); }
  getNewArrivals(): Observable<Book[]>                { return this.http.get<Book[]>(`${this.url}/new-arrivals`); }
  getTopRated(): Observable<Book[]>                   { return this.http.get<Book[]>(`${this.url}/top-rated`); }
  create(b: BookRequest): Observable<Book>            { return this.http.post<Book>(this.url, b); }
  update(id: number, b: BookRequest): Observable<Book>{ return this.http.put<Book>(`${this.url}/${id}`, b); }
  delete(id: number): Observable<any>                 { return this.http.delete(`${this.url}/${id}`); }
  updateStock(id: number, stock: number): Observable<Book> {
    return this.http.patch<Book>(`${this.url}/${id}/stock`, { stock });
  }
  getLowStock(threshold = 5): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.url}/admin/low-stock?threshold=${threshold}`);
  }
}

// ── Cart Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CartApiService {
  private url = `${API}/cart`;
  constructor(private http: HttpClient) {}

  getCart(userId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.url}/${userId}`);
  }
  addItem(userId: number, item: {bookId: number, bookTitle: string, price: number, quantity: number, coverImageUrl?: string}): Observable<Cart> {
    return this.http.post<Cart>(`${this.url}/${userId}/items`, item);
  }
  removeItem(userId: number, itemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.url}/${userId}/items/${itemId}`);
  }
  updateQuantity(userId: number, itemId: number, quantity: number): Observable<Cart> {
    return this.http.patch<Cart>(`${this.url}/${userId}/items/${itemId}`, { quantity });
  }
  clearCart(userId: number): Observable<any> {
    return this.http.delete(`${this.url}/${userId}/clear`);
  }
}

// ── Order Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private url = `${API}/orders`;
  constructor(private http: HttpClient) {}

  createPaymentIntent(req: PaymentIntentRequest): Observable<PaymentIntentResponse> {
    return this.http.post<PaymentIntentResponse>(`${this.url}/payment-intent`, req);
  }
  placeOrder(req: PlaceOrderRequest): Observable<Order>    { return this.http.post<Order>(`${this.url}/place`, req); }
  getAll(): Observable<Order[]>                            { return this.http.get<Order[]>(this.url); }
  getById(id: number): Observable<Order>                   { return this.http.get<Order>(`${this.url}/${id}`); }
  getByUser(userId: number): Observable<Order[]>           { return this.http.get<Order[]>(`${this.url}/user/${userId}`); }
  changeStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.url}/${id}/status`, { status });
  }
  cancel(id: number): Observable<Order>                    { return this.http.patch<Order>(`${this.url}/${id}/cancel`, {}); }
  getAddresses(userId: number): Observable<Address[]>      { return this.http.get<Address[]>(`${this.url}/addresses/user/${userId}`); }
  saveAddress(userId: number, addr: Address): Observable<Address> {
    return this.http.post<Address>(`${this.url}/addresses/${userId}`, addr);
  }
  deleteAddress(addressId: number): Observable<any>            { return this.http.delete(`${this.url}/addresses/${addressId}`); }
  getAnalytics(): Observable<Analytics>                    { return this.http.get<Analytics>(`${this.url}/admin/analytics`); }
}

// ── Wallet Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class WalletApiService {
  private url = `${API}/wallet`;
  constructor(private http: HttpClient) {}

  create(userId: number): Observable<Wallet>               { return this.http.post<Wallet>(`${this.url}/create/${userId}`, {}); }
  getWallet(userId: number): Observable<Wallet>            { return this.http.get<Wallet>(`${this.url}/${userId}`); }
  addMoney(userId: number, amount: number, remarks?: string): Observable<Wallet> {
    return this.http.post<Wallet>(`${this.url}/${userId}/add-money`, { amount, remarks });
  }
  deductMoney(userId: number, amount: number, orderId?: number): Observable<Wallet> {
    return this.http.post<Wallet>(`${this.url}/${userId}/deduct-money`, { amount, orderId });
  }
  getStatements(userId: number): Observable<Statement[]>   { return this.http.get<Statement[]>(`${this.url}/${userId}/statements`); }
}

// ── Review Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ReviewApiService {
  private url = `${API}/reviews`;
  constructor(private http: HttpClient) {}

  add(review: {bookId: number, userId: number, userName: string, rating: number, comment: string}): Observable<Review> {
    return this.http.post<Review>(this.url, review);
  }
  getByBook(bookId: number): Observable<Review[]>          { return this.http.get<Review[]>(`${this.url}/book/${bookId}`); }
  getByUser(userId: number): Observable<Review[]>          { return this.http.get<Review[]>(`${this.url}/user/${userId}`); }
  getAll(): Observable<Review[]>                           { return this.http.get<Review[]>(`${this.url}/admin/all`); }
  getSummary(bookId: number): Observable<RatingSummary>    { return this.http.get<RatingSummary>(`${this.url}/book/${bookId}/summary`); }
  update(id: number, data: {rating?: number, comment?: string}): Observable<Review> {
    return this.http.put<Review>(`${this.url}/${id}`, data);
  }
  delete(id: number): Observable<any>                      { return this.http.delete(`${this.url}/${id}`); }
}

// ── Notification Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private url = `${API}/notifications`;
  constructor(private http: HttpClient) {}

  getSummary(userId: number): Observable<NotificationSummary> {
    return this.http.get<NotificationSummary>(`${this.url}/user/${userId}/summary`);
  }
  getByUser(userId: number): Observable<Notification[]>    { return this.http.get<Notification[]>(`${this.url}/user/${userId}`); }
  getUnreadCount(userId: number): Observable<{unreadCount: number}> {
    return this.http.get<{unreadCount: number}>(`${this.url}/user/${userId}/unread-count`);
  }
  markAsRead(id: number): Observable<any>                  { return this.http.patch(`${this.url}/${id}/read`, {}); }
  markAllRead(userId: number): Observable<any>             { return this.http.patch(`${this.url}/user/${userId}/read-all`, {}); }
  delete(id: number): Observable<any>                      { return this.http.delete(`${this.url}/${id}`); }
}

// ── Wishlist Service ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class WishlistApiService {
  private url = `${API}/wishlist`;
  constructor(private http: HttpClient) {}

  get(userId: number): Observable<Wishlist>                { return this.http.get<Wishlist>(`${this.url}/${userId}`); }
  add(userId: number, item: {bookId: number, bookTitle: string, author?: string, bookPrice?: number, coverImageUrl?: string}): Observable<Wishlist> {
    return this.http.post<Wishlist>(`${this.url}/${userId}/add`, item);
  }
  remove(userId: number, itemId: number): Observable<Wishlist> {
    return this.http.delete<Wishlist>(`${this.url}/${userId}/items/${itemId}`);
  }
  clear(userId: number): Observable<any>                   { return this.http.delete(`${this.url}/${userId}/clear`); }
}
