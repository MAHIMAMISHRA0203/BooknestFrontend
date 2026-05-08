import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationApiService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Notification } from '../../shared/models/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-hero">
      <div class="container">
        <h1>Notifications <span style="color:var(--gold)">
          @if (unread() > 0) { ({{ unread() }} new) }
        </span></h1>
        <p>Stay updated on your orders and activity</p>
      </div>
    </div>
    <div class="container" style="padding:60px 24px">
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-bottom:24px">
        @if (unread() > 0) {
          <button class="btn btn-outline-gold btn-sm" (click)="markAllRead()">✓ Mark All Read</button>
        }
      </div>
      @if (loading()) { <div class="flex-center" style="padding:80px"><div class="spinner"></div></div>
      } @else if (notifications().length) {
        <div class="notif-list stagger">
          @for (n of notifications(); track n.notificationId) {
            <div class="notif-item" [class.unread]="!n.isRead">
              <div class="notif-icon">{{ getIcon(n.type) }}</div>
              <div class="notif-body">
                <p class="notif-msg">{{ n.message }}</p>
                <span class="notif-time">{{ n.createdAt | date:'medium' }}</span>
                <span class="notif-type">{{ n.type.replace('_',' ') }}</span>
              </div>
              <div class="notif-actions">
                @if (!n.isRead) { <button class="btn btn-sm btn-outline-gold" (click)="markRead(n.notificationId)">Mark Read</button> }
                <button class="delete-btn" (click)="delete(n.notificationId)" title="Delete">🗑️</button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-hero { background:linear-gradient(135deg,var(--navy),var(--navy-mid)); padding:100px 0 60px; h1{color:white} p{color:rgba(255,255,255,0.65)} }
    .notif-list { display:flex; flex-direction:column; gap:12px; }
    .notif-item { display:flex; align-items:flex-start; gap:16px; padding:20px 24px; background:white; border-radius:var(--radius-md); box-shadow:var(--shadow-sm); border-left:4px solid transparent; transition:var(--transition); &.unread{border-left-color:var(--gold);background:rgba(201,168,76,0.03)} &:hover{box-shadow:var(--shadow-md)} }
    .notif-icon { width:44px; height:44px; border-radius:50%; background:var(--cream); display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
    .notif-body { flex:1; }
    .notif-msg  { font-size:0.95rem; color:var(--navy); font-weight:500; margin-bottom:4px; }
    .notif-time { font-size:0.75rem; color:var(--text-light); }
    .notif-type { font-size:0.7rem; color:var(--gold-dark); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-left:10px; }
    .notif-actions { display:flex; align-items:center; gap:8px; }
    .delete-btn { background:none; border:none; cursor:pointer; font-size:1rem; padding:4px 8px; border-radius:4px; opacity:0.4; transition:all 0.2s; &:hover{opacity:1;background:rgba(231,76,60,0.1)} }
  `]
})
export class NotificationsComponent implements OnInit {
  notifApi      = inject(NotificationApiService);
  auth          = inject(AuthService);
  toast         = inject(ToastService);
  notifications = signal<Notification[]>([]);
  loading       = signal(true);
  unread        = signal(0);

  ngOnInit() {
    const uid = this.auth.getUserId();
    this.notifApi.getByUser(uid).subscribe({ next: n => { this.notifications.set(n); this.unread.set(n.filter(x=>!x.isRead).length); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  markRead(id: number) {
    this.notifApi.markAsRead(id).subscribe({ next: () => { this.notifications.update(list => list.map(n => n.notificationId===id ? {...n, isRead:true} : n)); this.unread.update(v => Math.max(0,v-1)); }, error: () => {} });
  }

  markAllRead() {
    this.notifApi.markAllRead(this.auth.getUserId()).subscribe({ next: () => { this.notifications.update(list => list.map(n => ({...n,isRead:true}))); this.unread.set(0); this.toast.success('All notifications marked as read'); }, error: () => {} });
  }

  delete(id: number) {
    this.notifApi.delete(id).subscribe({ next: () => { this.notifications.update(list => list.filter(n => n.notificationId!==id)); this.toast.success('Notification deleted'); }, error: () => {} });
  }

  getIcon(type: string): string {
    const m: any = { ORDER_PLACED:'📋', ORDER_CONFIRMED:'✅', ORDER_DISPATCHED:'🚚', ORDER_DELIVERED:'📦', PAYMENT_SUCCESS:'💳', PAYMENT_FAILED:'❌', LOW_STOCK:'⚠️' };
    return m[type] || '🔔';
  }
}
