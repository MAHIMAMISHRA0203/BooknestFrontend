import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BookApiService, OrderApiService } from './api.services';

describe('API services', () => {
  let httpMock: HttpTestingController;
  let bookApi: BookApiService;
  let orderApi: OrderApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpMock = TestBed.inject(HttpTestingController);
    bookApi = TestBed.inject(BookApiService);
    orderApi = TestBed.inject(OrderApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls featured books endpoint', () => {
    bookApi.getFeatured().subscribe();
    const req = httpMock.expectOne('/api/v1/books/featured');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('calls place order endpoint', () => {
    orderApi.placeOrder({
      userId: 1,
      paymentMode: 'COD',
      shippingAddress: {
        fullName: 'A User',
        mobileNumber: '9999999999',
        flatNumber: 'Flat 10',
        city: 'Pune',
        state: 'MH',
        pincode: '411001'
      },
      items: [
        {
          bookId: 1,
          bookTitle: 'Clean Code',
          author: 'Robert C. Martin',
          quantity: 1,
          price: 500
        }
      ]
    }).subscribe();

    const req = httpMock.expectOne('/api/v1/orders/place');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
