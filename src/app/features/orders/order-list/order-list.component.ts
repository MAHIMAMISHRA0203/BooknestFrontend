import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderApiService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../shared/models/models';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-hero">
      <div class="container">
        <h1>My <span class="hero-accent">Orders</span></h1>
        <p>Track and manage all your orders</p>
      </div>
    </div>
    <div class="container" style="padding:60px 24px">
      @if (loading()) {
        <div class="flex-center" style="padding:80px"><div class="spinner"></div></div>
      } @else if (orders().length) {
        <div class="orders-list stagger">
          @for (order of orders(); track order.orderId) {
            <div class="order-card">
              <div class="order-header">
                <div>
                  <span class="order-id">#{{ order.invoiceNumber }}</span>
                  <span class="order-date">{{ order.orderDate | date:'mediumDate' }}</span>
                </div>
                <div class="order-right">
                  <span class="badge" [ngClass]="getStatusClass(order.orderStatus)">
                    {{ getStatusIcon(order.orderStatus) }} {{ order.orderStatus }}
                  </span>
                  <span class="order-total">₹{{ order.amountPaid | number:'1.0-0' }}</span>
                </div>
              </div>
              <div class="order-items-preview">
                @for (item of order.items.slice(0,3); track item.itemId) {
                  <img [src]="item.coverImageUrl || 'assets/images/book-placeholder.png'"
                       [alt]="item.bookTitle" title="{{ item.bookTitle }}"
                       onerror="this.src='assets/images/book-placeholder.png'">
                }
                @if (order.items.length > 3) {
                  <div class="more-items">+{{ order.items.length - 3 }}</div>
                }
                <div class="order-meta">
                  <span>{{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</span>
                  <span>via {{ order.modeOfPayment }}</span>
                </div>
              </div>
              <div class="order-footer">
                <div class="status-track">
                  @for (s of statuses; track s) {
                    <div class="track-step" [class.done]="isStatusDone(order.orderStatus, s)"
                         [class.current]="order.orderStatus === s">
                      <div class="step-dot"></div>
                      <span>{{ s }}</span>
                    </div>
                  }
                </div>
                <div class="order-actions">
                  <a [routerLink]="['/orders', order.orderId]" class="btn btn-outline-gold btn-sm">View Details</a>
                  <button class="btn btn-secondary btn-sm" (click)="downloadInvoice(order)">Invoice</button>
                  @if (order.orderStatus === 'PLACED' || order.orderStatus === 'CONFIRMED') {
                    <button class="btn btn-danger btn-sm" (click)="cancelOrder(order.orderId)">Cancel</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
          <a routerLink="/books" class="btn btn-primary">Start Shopping</a>
        </div>
      }
    </div>
  `,
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  orderApi = inject(OrderApiService);
  auth     = inject(AuthService);
  toast    = inject(ToastService);
  orders   = signal<Order[]>([]);
  loading  = signal(true);
  statuses = ['PLACED','CONFIRMED','DISPATCHED','DELIVERED'];

  ngOnInit() {
    this.orderApi.getByUser(this.auth.getUserId()).subscribe({
      next: o => { this.orders.set(o.sort((a,b) => b.orderId - a.orderId)); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  cancelOrder(id: number) {
    this.orderApi.cancel(id).subscribe({
      next: updated => { this.orders.update(list => list.map(o => o.orderId === id ? updated : o)); this.toast.success('Order cancelled'); },
      error: (e) => this.toast.error(e?.error?.message || 'Cannot cancel order')
    });
  }

  getStatusClass(s: string) {
    const map: Record<string,string> = { PLACED:'badge-info', CONFIRMED:'badge-warning', DISPATCHED:'badge-gold', DELIVERED:'badge-success', CANCELLED:'badge-error' };
    return map[s] || 'badge-info';
  }

  getStatusIcon(s: string) {
    const map: Record<string,string> = { PLACED:'📋', CONFIRMED:'✅', DISPATCHED:'🚚', DELIVERED:'📦', CANCELLED:'❌' };
    return map[s] || '📋';
  }

  isStatusDone(current: string, step: string): boolean {
    const order = ['PLACED','CONFIRMED','DISPATCHED','DELIVERED'];
    return order.indexOf(current) >= order.indexOf(step);
  }

  downloadInvoice(order: Order) {
    const lines = [
      `Invoice Number: ${order.invoiceNumber}`,
      `Order ID: ${order.orderId}`,
      `Order Date: ${new Date(order.orderDate).toLocaleString()}`,
      `Payment Mode: ${order.modeOfPayment}`,
      `Order Status: ${order.orderStatus}`,
      '',
      'Items:',
      ...order.items.map(item => `${item.bookTitle} | Qty ${item.quantity} | Rs ${item.price} | Subtotal Rs ${item.subtotal}`),
      '',
      `Total Paid: Rs ${order.amountPaid}`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `invoice-${order.invoiceNumber || order.orderId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
