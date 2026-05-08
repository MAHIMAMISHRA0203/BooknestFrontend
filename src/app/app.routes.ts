import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },

  // Auth
  { path: 'login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'auth/oauth-callback', loadComponent: () => import('./features/auth/oauth-callback/oauth-callback.component').then(m => m.OauthCallbackComponent) },

  // Books
  { path: 'books',        loadComponent: () => import('./features/books/book-list/book-list.component').then(m => m.BookListComponent) },
  { path: 'books/:id',    loadComponent: () => import('./features/books/book-detail/book-detail.component').then(m => m.BookDetailComponent) },

  // Customer (protected)
  { path: 'cart',         loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent), canActivate: [authGuard] },
  { path: 'wishlist',     loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent), canActivate: [authGuard] },
  { path: 'orders',       loadComponent: () => import('./features/orders/order-list/order-list.component').then(m => m.OrderListComponent), canActivate: [authGuard] },
  { path: 'orders/:id',   loadComponent: () => import('./features/orders/order-detail/order-detail.component').then(m => m.OrderDetailComponent), canActivate: [authGuard] },
  { path: 'checkout',     loadComponent: () => import('./features/orders/checkout/checkout.component').then(m => m.CheckoutComponent), canActivate: [authGuard] },
  { path: 'wallet',       loadComponent: () => import('./features/wallet/wallet.component').then(m => m.WalletComponent), canActivate: [authGuard] },
  { path: 'profile',      loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'notifications',loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard] },

  // Admin (protected + admin role)
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '',         loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'books',    loadComponent: () => import('./features/admin/manage-books/manage-books.component').then(m => m.ManageBooksComponent) },
      { path: 'orders',   loadComponent: () => import('./features/admin/manage-orders/manage-orders.component').then(m => m.ManageOrdersComponent) },
      { path: 'users',    loadComponent: () => import('./features/admin/manage-users/manage-users.component').then(m => m.ManageUsersComponent) },
      { path: 'reviews',  loadComponent: () => import('./features/admin/manage-reviews/manage-reviews.component').then(m => m.ManageReviewsComponent) },
    ]
  },

  { path: '**', redirectTo: '' }
];
