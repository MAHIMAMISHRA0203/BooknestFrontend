import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CartApiService, OrderApiService, WalletApiService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Address, Cart, PaymentIntentResponse, Wallet } from '../../../shared/models/models';
import { environment } from '../../../../environments/environment';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  fb       = inject(FormBuilder);
  router   = inject(Router);
  cartApi  = inject(CartApiService);
  orderApi = inject(OrderApiService);
  walletApi= inject(WalletApiService);
  auth     = inject(AuthService);
  toast    = inject(ToastService);

  cart         = signal<Cart | null>(null);
  wallet       = signal<Wallet | null>(null);
  loading      = signal(true);
  placing      = signal(false);
  paymentMode  = signal<'COD' | 'WALLET' | 'STRIPE'>('COD');
  addresses    = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  saveAddress = signal(false);
  stripeIntent = signal<PaymentIntentResponse | null>(null);
  stripePaymentReferenceId = signal('');
  stripe: Stripe | null = null;
  elements: StripeElements | null = null;
  paymentElement: StripePaymentElement | null = null;
  stripeProcessing = signal(false);

  addressForm = this.fb.group({
    fullName:     ['', Validators.required],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    flatNumber:   ['', Validators.required],
    city:         ['', Validators.required],
    state:        ['', Validators.required],
    pincode:      ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  ngOnInit() {
    const uid = this.auth.getUserId();
    this.cartApi.getCart(uid).subscribe({ next: c => { this.cart.set(c); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.walletApi.getWallet(uid).subscribe({ next: w => this.wallet.set(w), error: () => {} });
    this.orderApi.getAddresses(uid).subscribe({ next: addresses => this.addresses.set(addresses), error: () => {} });
  }

  selectAddress(address: Address) {
    this.selectedAddressId.set(address.addressId ?? null);
    this.addressForm.patchValue(address);
  }
  async setupStripeElements(clientSecret: string) {
    if (!this.stripe) {
      this.stripe = await loadStripe(environment.stripePublishableKey);
    }
    if (!this.stripe) {
      this.toast.error('Stripe failed to initialize');
      return;
    }

    this.elements = this.stripe.elements({ clientSecret });
    this.paymentElement = this.elements.create('payment');

    const mountPoint = document.getElementById('stripe-payment-element');
    if (!mountPoint) return;
    mountPoint.innerHTML = '';
    this.paymentElement.mount('#stripe-payment-element');
  }

  async confirmStripePayment() {
    if (!this.stripe || !this.elements) {
      this.toast.error('Create payment intent first');
      return;
    }

    this.stripeProcessing.set(true);
    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      redirect: 'if_required'
    });
    this.stripeProcessing.set(false);

    if (result.error) {
      this.toast.error(result.error.message || 'Stripe payment failed');
      return;
    }

    const pi = result.paymentIntent;
    if (!pi || pi.status !== 'succeeded') {
      this.toast.error(`Payment not completed. Status: ${pi?.status || 'unknown'}`);
      return;
    }

    this.stripePaymentReferenceId.set(pi.id);
    this.toast.success('Stripe payment successful. You can place order now.');
  }

  createStripePaymentIntent() {
    const cart = this.cart();
    if (!cart?.items?.length) {
      this.toast.error('Your cart is empty');
      return;
    }
    const uid = this.auth.getUserId();
    this.orderApi.createPaymentIntent({
      userId: uid,
      items: cart.items.map(i => ({
        bookId: i.bookId,
        bookTitle: i.bookTitle,
        author: 'Unknown',
        price: i.price,
        quantity: i.quantity,
        coverImageUrl: i.coverImageUrl
      }))
    }).subscribe({
      next: (intent) => {
        this.stripeIntent.set(intent);
        this.stripePaymentReferenceId.set(intent.paymentIntentId);
        void this.setupStripeElements(intent.clientSecret);
        this.toast.success('Stripe payment intent created. Complete payment and place order.');
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to create Stripe payment intent');
      }
    });
  }

  placeOrder() {
    if (this.addressForm.invalid) { this.addressForm.markAllAsTouched(); return; }
    const cart = this.cart();
    if (!cart?.items?.length) { this.toast.error('Your cart is empty'); return; }

    if (this.paymentMode() === 'WALLET') {
      if (!this.wallet() || this.wallet()!.currentBalance < cart.totalPrice) {
        this.toast.error(`Insufficient wallet balance. You need Rs ${cart.totalPrice} but have Rs ${this.wallet()?.currentBalance || 0}`);
        return;
      }
    }

    if (this.paymentMode() === 'STRIPE' && !this.stripePaymentReferenceId().trim()) {
      this.toast.error('Please enter Stripe payment reference id (payment intent id).');
      return;
    }

    this.placing.set(true);
    const uid = this.auth.getUserId();
    const addr = this.addressForm.value as Address;

    this.orderApi.placeOrder({
      userId: uid,
      items: cart.items.map(i => ({
        bookId: i.bookId, bookTitle: i.bookTitle,
        author: 'Unknown', price: i.price, quantity: i.quantity,
        coverImageUrl: i.coverImageUrl
      })),
      shippingAddress: addr,
      paymentMode: this.paymentMode(),
      paymentReferenceId: this.paymentMode() === 'STRIPE' ? this.stripePaymentReferenceId().trim() : undefined
    }).subscribe({
      next: (order) => {
        if (this.saveAddress() && !this.selectedAddressId()) {
          this.orderApi.saveAddress(uid, addr).subscribe({ next: () => {}, error: () => {} });
        }
        if (this.paymentMode() === 'WALLET') {
          this.walletApi.deductMoney(uid, cart.totalPrice, order.orderId).subscribe();
        }
        this.cartApi.clearCart(uid).subscribe();
        this.toast.success('Order placed successfully!');
        this.router.navigate(['/orders', order.orderId]);
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to place order');
        this.placing.set(false);
      }
    });
  }

  get insufficientBalance(): boolean {
    return this.paymentMode() === 'WALLET' && !!this.wallet() && !!this.cart() &&
           this.wallet()!.currentBalance < this.cart()!.totalPrice;
  }
}
