import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/Auth.service';

@Component({
  selector: 'app-conductor-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './conductor-login.html',
  styleUrl: './conductor-login.css',
})
export class ConductorLogin {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error: string | null = null;
  cargando = false;
  showPass = false;

  submit(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Ingresa tu correo y contrasena.';
      return;
    }

    this.error = null;
    this.cargando = true;

    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: (user) => {
        this.cargando = false;

        if (['conductor', 'driver'].includes(this.auth.roleOf(user))) {
          this.router.navigate(['/conductor']);
          return;
        }

        this.auth.logout();
        this.error = 'Este acceso es solo para conductores.';
      },
      error: () => {
        this.cargando = false;
        this.error = 'Correo o contrasena incorrectos.';
      },
    });
  }

  togglePass(): void {
    this.showPass = !this.showPass;
  }
}
