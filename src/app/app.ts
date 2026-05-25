import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/Auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  scrolled    = false;
  menuOpen    = false;
  isLoginRoute = false;
  isAdminRoute = false;

  get isLoggedIn(): boolean { return this.auth.isLoggedIn; }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects ?? e.url;
      this.isLoginRoute = url.includes('/login');
      this.isAdminRoute = url.startsWith('/dash');
      this.menuOpen = false;
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 40;
  }
}