import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderApiService } from '../../core/services/api.services';
import { Address, UserProfile } from '../../shared/models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-hero">
      <div class="container"><h1>My <span style="color:var(--gold)">Profile</span></h1><p>Manage account and delivery addresses</p></div>
    </div>

    <div class="container" style="padding:60px 24px">
      <div class="profile-layout">
        <div class="profile-sidebar">
          <div class="avatar-block">
            <div class="big-avatar">{{ auth.currentUser()?.fullName?.charAt(0)?.toUpperCase() }}</div>
            <h3>{{ auth.currentUser()?.fullName }}</h3>
            <p>{{ auth.currentUser()?.email }}</p>
            <span class="badge" [ngClass]="auth.isAdmin() ? 'badge-gold' : 'badge-navy'">{{ auth.currentUser()?.role }}</span>
          </div>
          <nav class="profile-nav">
            <a routerLink="/orders">My Orders</a>
            <a routerLink="/wishlist">Wishlist</a>
            <a routerLink="/wallet">Wallet</a>
            <a routerLink="/notifications">Notifications</a>
            <button class="logout-nav" (click)="auth.logout()">Logout</button>
          </nav>
        </div>

        <div class="profile-main">
          <div class="card">
            <div class="card-header"><h3>Edit Profile</h3></div>
            <div class="card-body">
              <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" formControlName="fullName" class="form-control">
                </div>
                <div class="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" formControlName="mobile" class="form-control">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [value]="auth.currentUser()?.email" class="form-control" disabled>
                </div>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  @if (saving()) { <span class="spinner spinner-sm"></span> }
                  Save Changes
                </button>
              </form>
            </div>
          </div>

          <div class="card" style="margin-top:24px">
            <div class="card-header"><h3>Change Password</h3></div>
            <div class="card-body">
              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                <div class="form-group">
                  <label>Current Password</label>
                  <input type="password" formControlName="oldPassword" class="form-control">
                </div>
                <div class="form-group">
                  <label>New Password</label>
                  <input type="password" formControlName="newPassword" class="form-control">
                </div>
                <button type="submit" class="btn btn-secondary" [disabled]="changingPwd()">
                  @if (changingPwd()) { <span class="spinner spinner-sm"></span> }
                  Change Password
                </button>
              </form>
            </div>
          </div>

          <div class="card" style="margin-top:24px">
            <div class="card-header">
              <h3>Saved Addresses</h3>
              <button class="btn btn-outline-gold btn-sm" (click)="toggleAddressForm()">
                {{ showAddressForm() ? 'Close' : 'Add Address' }}
              </button>
            </div>
            <div class="card-body">
              @if (showAddressForm()) {
                <form [formGroup]="addressForm" (ngSubmit)="addAddress()" style="margin-bottom:20px">
                  <div class="grid-2">
                    <div class="form-group"><label>Full Name</label><input class="form-control" formControlName="fullName"></div>
                    <div class="form-group"><label>Mobile</label><input class="form-control" formControlName="mobileNumber"></div>
                  </div>
                  <div class="form-group"><label>Flat/Street</label><input class="form-control" formControlName="flatNumber"></div>
                  <div class="grid-2">
                    <div class="form-group"><label>City</label><input class="form-control" formControlName="city"></div>
                    <div class="form-group"><label>State</label><input class="form-control" formControlName="state"></div>
                  </div>
                  <div class="form-group" style="max-width:220px"><label>Pincode</label><input class="form-control" formControlName="pincode"></div>
                  <button class="btn btn-primary btn-sm" type="submit" [disabled]="addressSaving()">Save Address</button>
                </form>
              }

              @if (loadingAddresses()) {
                <div class="flex-center" style="padding:20px"><div class="spinner spinner-sm"></div></div>
              } @else if (addresses().length) {
                <div class="address-list">
                  @for (address of addresses(); track address.addressId) {
                    <article class="address-card">
                      <div>
                        <h4>{{ address.fullName }}</h4>
                        <p>{{ address.flatNumber }}</p>
                        <p>{{ address.city }}, {{ address.state }} - {{ address.pincode }}</p>
                        <p>{{ address.mobileNumber }}</p>
                      </div>
                      <button class="btn btn-danger btn-sm" (click)="removeAddress(address.addressId!)">Delete</button>
                    </article>
                  }
                </div>
              } @else {
                <p class="text-muted">No saved addresses yet. Add one to speed up checkout.</p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-hero { background:linear-gradient(135deg,var(--navy),var(--navy-mid)); padding:100px 0 60px; h1{color:white} p{color:rgba(255,255,255,0.65)} }
    .profile-layout { display:grid; grid-template-columns:280px 1fr; gap:32px; align-items:start; }
    .profile-sidebar { position:sticky; top:90px; }
    .avatar-block { background:white; border-radius:var(--radius-lg); padding:28px; text-align:center; margin-bottom:16px; box-shadow:var(--shadow-sm); }
    .big-avatar { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--gold-dark)); display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:700; color:var(--navy); margin:0 auto 16px; }
    .avatar-block h3 { margin-bottom:4px; font-size:1.1rem; }
    .avatar-block p  { font-size:0.85rem; color:var(--text-light); margin-bottom:10px; }
    .profile-nav { background:white; border-radius:var(--radius-lg); padding:12px; box-shadow:var(--shadow-sm); display:flex; flex-direction:column; gap:2px; }
    .profile-nav a, .profile-nav button { padding:12px 16px; border-radius:8px; font-size:0.9rem; color:var(--text-dark); text-decoration:none; font-weight:500; transition:all 0.2s; background:none; border:none; cursor:pointer; font-family:var(--font-body); width:100%; text-align:left; }
    .profile-nav a:hover, .profile-nav button:hover { background:var(--cream); }
    .logout-nav { color:var(--error); }
    .address-list { display:grid; gap:12px; }
    .address-card { border:1px solid var(--cream-dark); border-radius:10px; padding:14px; display:flex; justify-content:space-between; gap:14px; }
    .address-card h4 { font-size:0.95rem; margin-bottom:3px; }
    .address-card p { font-size:0.82rem; color:var(--text-mid); line-height:1.5; }
    .text-muted { color:var(--text-light); font-size:0.9rem; }
    @media (max-width: 768px) { .profile-layout { grid-template-columns:1fr; } .profile-sidebar { position:static; } }
  `]
})
export class ProfileComponent implements OnInit {
  fb = inject(FormBuilder);
  auth = inject(AuthService);
  toast = inject(ToastService);
  http = inject(HttpClient);
  orderApi = inject(OrderApiService);

  saving = signal(false);
  changingPwd = signal(false);
  addressSaving = signal(false);
  loadingAddresses = signal(false);
  showAddressForm = signal(false);
  addresses = signal<Address[]>([]);

  profileForm = this.fb.group({
    fullName: ['', Validators.required],
    mobile: ['']
  });

  passwordForm = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  addressForm = this.fb.group({
    fullName: ['', Validators.required],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    flatNumber: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  ngOnInit(): void {
    this.loadProfile();
    this.loadAddresses();
  }

  loadProfile(): void {
    this.http.get<UserProfile>(`${environment.apiUrl}/auth/profile/${this.auth.getUserId()}`).subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          fullName: profile.fullName,
          mobile: profile.mobile
        });
      },
      error: () => {
        this.profileForm.patchValue({
          fullName: this.auth.currentUser()?.fullName || '',
          mobile: this.auth.currentUser()?.mobile || ''
        });
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.http.put<UserProfile>(`${environment.apiUrl}/auth/profile/${this.auth.getUserId()}`, this.profileForm.value).subscribe({
      next: (profile) => {
        this.toast.success('Profile updated');
        const current = this.auth.currentUser();
        if (current) {
          this.auth.currentUser.set({ ...current, fullName: profile.fullName, mobile: profile.mobile });
        }
        localStorage.setItem('fullName', profile.fullName);
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('Update failed');
        this.saving.set(false);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPwd.set(true);
    this.http.put(`${environment.apiUrl}/auth/change-password/${this.auth.getUserId()}`, this.passwordForm.value).subscribe({
      next: () => {
        this.toast.success('Password changed');
        this.passwordForm.reset();
        this.changingPwd.set(false);
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to change password');
        this.changingPwd.set(false);
      }
    });
  }

  loadAddresses(): void {
    this.loadingAddresses.set(true);
    this.orderApi.getAddresses(this.auth.getUserId()).subscribe({
      next: (items) => {
        this.addresses.set(items);
        this.loadingAddresses.set(false);
      },
      error: () => this.loadingAddresses.set(false)
    });
  }

  addAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.addressSaving.set(true);
    this.orderApi.saveAddress(this.auth.getUserId(), this.addressForm.value as Address).subscribe({
      next: (saved) => {
        this.addresses.update((items) => [saved, ...items]);
        this.addressForm.reset();
        this.showAddressForm.set(false);
        this.addressSaving.set(false);
        this.toast.success('Address saved');
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Unable to save address');
        this.addressSaving.set(false);
      }
    });
  }

  removeAddress(addressId: number): void {
    this.orderApi.deleteAddress(addressId).subscribe({
      next: () => {
        this.addresses.update((items) => items.filter((item) => item.addressId !== addressId));
        this.toast.success('Address deleted');
      },
      error: (e) => this.toast.error(e?.error?.message || 'Unable to delete address')
    });
  }

  toggleAddressForm(): void {
    this.showAddressForm.set(!this.showAddressForm());
  }
}
