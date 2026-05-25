import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/Auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  email    = '';
  password = '';
  error: string | null = null;
  cargando = false;
  showPass = false;

  submit(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Ingresa tu email y contraseña.';
      return;
    }
    this.error    = null;
    this.cargando = true;

    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: (user) => {
        this.cargando = false;
        // Solo admins acceden al panel
        if (user.rol === 'admin') {
          this.router.navigate(['../dash/dashboard']);
        } else {
          // Conductores u otros roles van a home
          this.router.navigate(['/home']);
        }
      },
      error: () => {
        this.cargando = false;
        this.error    = 'Email o contraseña incorrectos.';
      },
    });
  }

  togglePass(): void { this.showPass = !this.showPass; }
}