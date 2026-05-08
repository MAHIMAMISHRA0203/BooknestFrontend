import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationApiService } from '../../../core/services/api.services';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  auth = inject(AuthService);
  notifApi = inject(NotificationApiService);

  mobileOpen = signal(false);
  unreadCount = signal(0);
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }

  ngOnInit() {
    if (this.auth.isLoggedIn()) this.loadUnread();
  }

  loadUnread() {
    const userId = this.auth.getUserId();
    if (userId) {
      this.notifApi.getUnreadCount(userId).subscribe({
        next: r => this.unreadCount.set(r.unreadCount),
        error: () => {}
      });
    }
  }

  toggleMobile() { this.mobileOpen.update(v => !v); }
  closeMobile()  { this.mobileOpen.set(false); }
  logout()       { this.auth.logout(); this.closeMobile(); }
}
