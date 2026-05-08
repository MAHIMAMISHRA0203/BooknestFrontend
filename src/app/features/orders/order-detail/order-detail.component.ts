import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrderApiService } from '../../../core/services/api.services';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../shared/models/models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-hero">
      <div class="container">
        <a routerLink="/orders" class="back-link">← Back to Orders</a>
        <h1>Order <span class="hero-accent">Details</span></h1>
      </div>
    </div>
    <div class="container" style="padding:60px 24px">
      @if (loading()) {
        <div class="flex-center" style="padding:80px"><div class="spinner"></div></div>
      } @else {
        @if (order(); as o) {
          <div class="detail-layout">
          <div class="detail-main">

            <!-- Status -->
            <div class="card" style="margin-bottom:24px">
              <div class="card-body">
                <div class="order-status-header">
                  <div>
                    <p class="order-label">Invoice</p>
                    <h3>{{ o.invoiceNumber }}</h3>
                  </div>
                  <span class="badge badge-lg" [ngClass]="getStatusClass(o.orderStatus)">
                    {{ getStatusIcon(o.orderStatus) }} {{ o.orderStatus }}
                  </span>
                </div>
                <div class="status-stepper">
                  @for (s of statuses; track s) {
                    <div class="step" [class.done]="isStatusDone(o.orderStatus, s)"
                         [class.current]="o.orderStatus === s"
                         [class.cancelled]="o.orderStatus === 'CANCELLED'">
                      <div class="step-circle">{{ getStatusIcon(s) }}</div>
                      <span>{{ s }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Items -->
            <div class="card" style="margin-bottom:24px">
              <div class="card-header"><h3>📚 Ordered Items ({{ o.items.length }})</h3></div>
              <div class="card-body" style="padding:0">
                @for (item of o.items; track item.itemId) {
                  <div class="order-item">
                    <img [src]="item.coverImageUrl || 'assets/images/book-placeholder.png'"
                         [alt]="item.bookTitle"
                         onerror="this.src='assets/images/book-placeholder.png'">
                    <div class="item-info">
                      <h4>{{ item.bookTitle }}</h4>
                      <p>by {{ item.author }}</p>
                      <p>Qty: {{ item.quantity }} × ₹{{ item.price | number:'1.0-0' }}</p>
                    </div>
                    <span class="item-subtotal">₹{{ item.subtotal | number:'1.0-0' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Address -->
            @if (o.shippingAddress) {
              <div class="card">
                <div class="card-header"><h3>📍 Delivery Address</h3></div>
                <div class="card-body">
                  <p><strong>{{ o.shippingAddress.fullName }}</strong></p>
                  <p>{{ o.shippingAddress.flatNumber }}</p>
                  <p>{{ o.shippingAddress.city }}, {{ o.shippingAddress.state }} — {{ o.shippingAddress.pincode }}</p>
                  <p>📞 {{ o.shippingAddress.mobileNumber }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Summary sidebar -->
          <div class="detail-sidebar">
            <div class="card">
              <div class="card-header"><h3>💰 Payment Summary</h3></div>
              <div class="card-body">
                <div class="summary-row"><span>Order Date</span><span>{{ o.orderDate | date:'mediumDate' }}</span></div>
                <div class="summary-row"><span>Payment Mode</span><span><strong>{{ o.modeOfPayment }}</strong></span></div>
                <div class="summary-row"><span>Items Total</span><span>₹{{ o.amountPaid | number:'1.0-0' }}</span></div>
                <div class="summary-row"><span>Delivery</span><span class="text-success">FREE</span></div>
                <div class="summary-divider"></div>
                <div class="summary-row total"><strong>Total Paid</strong><strong>₹{{ o.amountPaid | number:'1.0-0' }}</strong></div>
                <button class="btn btn-secondary btn-full" style="margin-top:12px" (click)="downloadInvoice(o)">Download Invoice</button>
              </div>
            </div>
            @if (o.orderStatus === 'PLACED' || o.orderStatus === 'CONFIRMED') {
              <button class="btn btn-danger btn-full" style="margin-top:16px" (click)="cancelOrder(o.orderId)">Cancel Order</button>
            }
          </div>
        </div>
        } @else {
          <div class="empty-state">
            <h3>Order not found</h3>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-hero { background: linear-gradient(135deg, var(--navy), var(--navy-mid)); padding: 100px 0 60px; h1 { color: white; } .hero-accent { color: var(--gold); } }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.875rem; display: block; margin-bottom: 12px; &:hover { color: var(--gold); } }
    .detail-layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
    .detail-sidebar { position: sticky; top: 90px; }
    .order-status-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
    .order-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-light); margin-bottom: 4px; }
    .badge-lg { font-size: 0.875rem; padding: 8px 16px; }
    .status-stepper { display: flex; align-items: flex-start; gap: 0; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; position: relative;
      &::before { content: ''; position: absolute; top: 20px; right: 50%; width: 100%; height: 2px; background: var(--cream-dark); }
      &:first-child::before { display: none; }
      &.done::before, &.done.current::before { background: var(--success); }
      &.done .step-circle, &.current .step-circle { border-color: var(--success); background: rgba(46,204,113,0.1); }
      &.current .step-circle { border-color: var(--gold); background: rgba(201,168,76,0.1); box-shadow: 0 0 0 4px rgba(201,168,76,0.15); }
      span { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-light); text-align: center; }
    }
    .step-circle { width: 44px; height: 44px; border-radius: 50%; border: 2px solid var(--cream-dark); background: white; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; position: relative; z-index: 1; transition: all 0.3s; }
    .order-item { display: flex; align-items: center; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--cream-dark); &:last-child { border: none; } img { width: 56px; height: 76px; object-fit: cover; border-radius: 8px; } }
    .item-info { flex: 1; h4 { font-size: 0.95rem; margin-bottom: 4px; } p { font-size: 0.8rem; color: var(--text-light); } }
    .item-subtotal { font-family: var(--font-display); font-weight: 700; color: var(--navy); }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-mid); padding: 8px 0; &.total { color: var(--navy); font-size: 1.05rem; } }
    .summary-divider { height: 1px; background: var(--cream-dark); margin: 4px 0; }
    .text-success { color: var(--success); font-weight: 600; }
    @media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } .detail-sidebar { position: static; } .status-stepper span { display: none; } }
  `]
})
export class OrderDetailComponent implements OnInit {
  route    = inject(ActivatedRoute);
  orderApi = inject(OrderApiService);
  toast    = inject(ToastService);
  order    = signal<Order | null>(null);
  loading  = signal(true);
  statuses = ['PLACED','CONFIRMED','DISPATCHED','DELIVERED'];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.orderApi.getById(id).subscribe({ next: o => { this.order.set(o); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  cancelOrder(id: number) {
    this.orderApi.cancel(id).subscribe({ next: o => { this.order.set(o); this.toast.success('Order cancelled'); }, error: (e) => this.toast.error(e?.error?.message || 'Cannot cancel') });
  }

  getStatusClass(s: string) { const m: any = {PLACED:'badge-info',CONFIRMED:'badge-warning',DISPATCHED:'badge-gold',DELIVERED:'badge-success',CANCELLED:'badge-error'}; return m[s]||'badge-info'; }
  getStatusIcon(s: string)  { const m: any = {PLACED:'📋',CONFIRMED:'✅',DISPATCHED:'🚚',DELIVERED:'📦',CANCELLED:'❌'}; return m[s]||'📋'; }
  isStatusDone(current: string, step: string): boolean { const o = ['PLACED','CONFIRMED','DISPATCHED','DELIVERED']; return o.indexOf(current) >= o.indexOf(step); }

  downloadInvoice(order: Order) {
    const lines = [
      `Invoice Number: ${order.invoiceNumber}`,
      `Order ID: ${order.orderId}`,
      `Order Date: ${new Date(order.orderDate).toLocaleString()}`,
      `Payment Mode: ${order.modeOfPayment}`,
      '',
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
