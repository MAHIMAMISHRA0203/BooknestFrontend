import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WalletApiService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Wallet, Statement } from '../../shared/models/models';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent implements OnInit {
  walletApi = inject(WalletApiService);
  auth      = inject(AuthService);
  toast     = inject(ToastService);

  wallet     = signal<Wallet | null>(null);
  statements = signal<Statement[]>([]);
  loading    = signal(true);
  addAmount  = signal(0);
  adding     = signal(false);
  showAddForm = signal(false);
  quickAmounts = [100, 250, 500, 1000, 2000];

  ngOnInit() { this.loadWallet(); }

  loadWallet() {
    const uid = this.auth.getUserId();
    this.walletApi.getWallet(uid).subscribe({
      next: w => { this.wallet.set(w); this.loadStatements(); this.loading.set(false); },
      error: () => {
        // Wallet not found — create one
        this.walletApi.create(uid).subscribe({
          next: w => { this.wallet.set(w); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
      }
    });
  }

  loadStatements() {
    this.walletApi.getStatements(this.auth.getUserId()).subscribe({
      next: s => this.statements.set(s.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())),
      error: () => {}
    });
  }

  addMoney() {
    if (!this.addAmount() || this.addAmount() <= 0) { this.toast.error('Enter a valid amount'); return; }
    this.adding.set(true);
    this.walletApi.addMoney(this.auth.getUserId(), this.addAmount(), 'Wallet top-up').subscribe({
      next: w => {
        this.wallet.set(w);
        this.toast.success(`₹${this.addAmount()} added to wallet! 💳`);
        this.addAmount.set(0);
        this.showAddForm.set(false);
        this.adding.set(false);
        this.loadStatements();
      },
      error: () => { this.toast.error('Failed to add money'); this.adding.set(false); }
    });
  }

  toggleAddMoneyForm() {
    this.showAddForm.set(!this.showAddForm());
  }
}
