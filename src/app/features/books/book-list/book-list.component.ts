import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookApiService } from '../../../core/services/api.services';
import { BookCardComponent } from '../../../shared/components/book-card/book-card.component';
import { Book } from '../../../shared/models/models';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BookCardComponent],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss']
})
export class BookListComponent implements OnInit {
  bookApi = inject(BookApiService);
  route   = inject(ActivatedRoute);

  allBooks    = signal<Book[]>([]);
  books       = signal<Book[]>([]);
  loading     = signal(true);
  searchQuery = signal('');
  activeGenre = signal('All');
  sortBy      = signal('default');
  viewMode    = signal<'grid' | 'list'>('grid');

  private searchSubject = new Subject<string>();

  genres = ['All','Fiction','Non-Fiction','Technology','Science','History',
            'Biography','Self Help','Romance','Mystery','Fantasy','Children'];

  ngOnInit() {
    this.searchSubject.pipe(debounceTime(400))
      .subscribe(q => q.length > 1 ? this.performSearch(q) : this.loadAll());

    this.route.queryParams.subscribe(p => {
      if (p['genre']) { this.activeGenre.set(p['genre']); this.filterByGenre(p['genre']); }
      else this.loadAll();
    });
  }

  loadAll() {
    this.loading.set(true);
    this.bookApi.getAll().subscribe({
      next: b => { this.allBooks.set(b); this.applyFilters(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearchInput(q: string) { this.searchQuery.set(q); this.searchSubject.next(q); }

  performSearch(q: string) {
    this.loading.set(true);
    this.bookApi.search(q).subscribe({
      next: b => { this.books.set(b); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filterByGenre(genre: string) {
    this.activeGenre.set(genre);
    if (genre === 'All') { this.loadAll(); return; }
    this.loading.set(true);
    this.bookApi.getByGenre(genre).subscribe({
      next: b => { this.books.set(b); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilters() {
    let filtered = [...this.allBooks()];
    if (this.activeGenre() !== 'All') {
      filtered = filtered.filter(b => b.genre === this.activeGenre());
    }
    switch (this.sortBy()) {
      case 'price-asc':  filtered.sort((a,b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a,b) => b.price - a.price); break;
      case 'rating':     filtered.sort((a,b) => b.rating - a.rating); break;
      case 'title':      filtered.sort((a,b) => a.title.localeCompare(b.title)); break;
    }
    this.books.set(filtered);
  }

  onSortChange(sort: string) { this.sortBy.set(sort); this.applyFilters(); }
  clearSearch() { this.searchQuery.set(''); this.loadAll(); }
}
