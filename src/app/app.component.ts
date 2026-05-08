import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastContainerComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-toast-container></app-toast-container>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 72px);
      background:
        radial-gradient(circle at 95% 0%, rgba(201,168,76,0.08), transparent 24%),
        radial-gradient(circle at 0% 38%, rgba(36,59,85,0.06), transparent 24%),
        var(--cream);
    }
  `]
})
export class AppComponent {}
