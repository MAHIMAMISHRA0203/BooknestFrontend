// ── Auth Models ──────────────────────────────────────
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  mobile?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  message: string;
}

export interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
  provider: string;
  active: boolean;
}

// ── Book Models ──────────────────────────────────────
export interface Book {
  bookId: number;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publisher: string;
  price: number;
  stock: number;
  rating: number;
  description: string;
  coverImageUrl: string;
  publishedDate: string;
  featured: boolean;
  active: boolean;
  inStock: boolean;
}

export interface BookRequest {
  title: string;
  author: string;
  isbn?: string;
  genre: string;
  publisher?: string;
  price: number;
  stock: number;
  description?: string;
  coverImageUrl?: string;
  publishedDate?: string;
  featured?: boolean;
}

// ── Cart Models ──────────────────────────────────────
export interface CartItem {
  itemId: number;
  bookId: number;
  bookTitle: string;
  price: number;
  quantity: number;
  coverImageUrl: string;
  subtotal: number;
}

export interface Cart {
  cartId: number;
  userId: number;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

// ── Order Models ──────────────────────────────────────
export interface OrderItem {
  itemId: number;
  bookId: number;
  bookTitle: string;
  author: string;
  price: number;
  quantity: number;
  subtotal: number;
  coverImageUrl: string;
}

export interface Address {
  addressId?: number;
  fullName: string;
  mobileNumber: string;
  flatNumber: string;
  city: string;
  state: string;
  pincode: string;
  defaultAddress?: boolean;
}

export interface Order {
  orderId: number;
  userId: number;
  orderDate: string;
  amountPaid: number;
  modeOfPayment: string;
  orderStatus: string;
  invoiceNumber: string;
  items: OrderItem[];
  shippingAddress: Address;
}

export interface PlaceOrderRequest {
  userId: number;
  items: {
    bookId: number;
    bookTitle: string;
    author: string;
    price: number;
    quantity: number;
    coverImageUrl?: string;
  }[];
  shippingAddress: Address;
  paymentMode: 'COD' | 'WALLET' | 'STRIPE';
  paymentReferenceId?: string;
}

export interface PaymentIntentRequest {
  userId: number;
  items: {
    bookId: number;
    bookTitle: string;
    author: string;
    price: number;
    quantity: number;
    coverImageUrl?: string;
  }[];
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

// ── Wallet Models ──────────────────────────────────────
export interface Wallet {
  walletId: number;
  userId: number;
  currentBalance: number;
}

export interface Statement {
  statementId: number;
  transactionType: string;
  amount: number;
  dateTime: string;
  orderId?: number;
  transactionRemarks: string;
}

// ── Review Models ──────────────────────────────────────
export interface Review {
  reviewId: number;
  bookId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  reviewDate: string;
  verified: boolean;
}

export interface RatingSummary {
  bookId: number;
  averageRating: number;
  totalReviews: number;
}

// ── Notification Models ──────────────────────────────────────
export interface Notification {
  notificationId: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSummary {
  notifications: Notification[];
  unreadCount: number;
}

// ── Wishlist Models ──────────────────────────────────────
export interface WishlistItem {
  itemId: number;
  bookId: number;
  bookTitle: string;
  author: string;
  bookPrice: number;
  coverImageUrl: string;
}

export interface Wishlist {
  wishlistId: number;
  userId: number;
  createdAt: string;
  items: WishlistItem[];
  totalItems: number;
}

// ── Analytics ──────────────────────────────────────
export interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
}

// ── API Response ──────────────────────────────────────
export interface ApiError {
  timestamp: string;
  status: number;
  message: string;
}
