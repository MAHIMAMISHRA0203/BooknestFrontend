import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookApiService } from '../../core/services/api.services';
import { BookCardComponent } from '../../shared/components/book-card/book-card.component';
import { Book } from '../../shared/models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, BookCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  bookApi = inject(BookApiService);

  featured  = signal<Book[]>([]);
  newArrivals = signal<Book[]>([]);
  topRated  = signal<Book[]>([]);
  loading   = signal(true);

  genres = [
    { name: 'Fiction',     icon: '📖', color: '#c9a84c' },
    { name: 'Technology',  icon: '💻', color: '#3498db' },
    { name: 'Self Help',   icon: '🌱', color: '#2ecc71' },
    { name: 'Biography',   icon: '👤', color: '#9b59b6' },
    { name: 'Science',     icon: '🔬', color: '#e74c3c' },
    { name: 'History',     icon: '🏛️',  color: '#e67e22' },
    { name: 'Romance',     icon: '💝', color: '#e91e63' },
    { name: 'Mystery',     icon: '🔍', color: '#34495e' },
  ];

  ngOnInit() {
    this.bookApi.getFeatured().subscribe({ next: b => this.featured.set(b.slice(0,8)), error: () => {} });
    this.bookApi.getNewArrivals().subscribe({ next: b => this.newArrivals.set(b.slice(0,4)), error: () => {} });
    this.bookApi.getTopRated().subscribe({ next: b => { this.topRated.set(b.slice(0,4)); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
}
