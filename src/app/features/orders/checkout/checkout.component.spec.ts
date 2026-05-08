import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CheckoutComponent } from './checkout.component';
import { CartApiService, OrderApiService, WalletApiService } from '../../../core/services/api.services';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  const cartApiMock = {
    getCart: jasmine.createSpy('getCart').and.returnValue(of({
      cartId: 1,
      userId: 1,
      totalPrice: 500,
      totalItems: 1,
      items: [{ itemId: 1, bookId: 11, bookTitle: 'Sample', quantity: 1, price: 500, subtotal: 500, coverImageUrl: '' }]
    })),
    clearCart: jasmine.createSpy('clearCart').and.returnValue(of({}))
  };

  const walletApiMock = {
    getWallet: jasmine.createSpy('getWallet').and.returnValue(of({ walletId: 1, userId: 1, currentBalance: 1000 })),
    deductMoney: jasmine.createSpy('deductMoney').and.returnValue(of({}))
  };

  const orderApiMock = {
    getAddresses: jasmine.createSpy('getAddresses').and.returnValue(of([])),
    placeOrder: jasmine.createSpy('placeOrder').and.returnValue(of({ orderId: 1001 })),
    saveAddress: jasmine.createSpy('saveAddress').and.returnValue(of({}))
  };

  const authMock = { getUserId: () => 1 };
  const toastMock = { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent, RouterTestingModule],
      providers: [
        { provide: CartApiService, useValue: cartApiMock },
        { provide: WalletApiService, useValue: walletApiMock },
        { provide: OrderApiService, useValue: orderApiMock },
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('flags insufficient balance for wallet mode', () => {
    component.paymentMode.set('WALLET');
    component.wallet.set({ walletId: 1, userId: 1, currentBalance: 100 });
    component.cart.set({
      cartId: 1,
      userId: 1,
      totalPrice: 500,
      totalItems: 1,
      items: []
    });
    expect(component.insufficientBalance).toBeTrue();
  });
});
