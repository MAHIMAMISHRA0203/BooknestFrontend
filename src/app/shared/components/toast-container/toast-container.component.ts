import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}">
          <span class="toast-icon">
            {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️' }}
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 90px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px;
    }
    .toast {
      padding: 14px 16px; border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.2);
      display: flex; align-items: center; gap: 12px;
      min-width: 300px; max-width: 400px;
      animation: slideInRight 0.3s ease;
      font-size: 0.9rem; font-weight: 500;
    }
    .toast-success { background: #27ae60; color: white; }
    .toast-error   { background: #e74c3c; color: white; }
    .toast-warning { background: #f39c12; color: white; }
    .toast-info    { background: #3498db; color: white; }
    .toast-message { flex: 1; }
    .toast-close {
      background: none; border: none; color: rgba(255,255,255,0.8);
      cursor: pointer; font-size: 0.9rem; padding: 2px 6px;
      border-radius: 4px;
      &:hover { background: rgba(0,0,0,0.15); }
    }
    @keyframes slideInRight {
      from { transform: translateX(120%); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
