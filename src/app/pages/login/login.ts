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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error: string | null = null;
  cargando = false;
  showPass = false;

  submit(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Ingresa tu email y contraseña.';
      return;
    }

    this.error = null;
    this.cargando = true;

    this.auth.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({
next: (user) => {
  this.cargando = false;

  console.log('================================');
  console.log('LOGIN EXITOSO');
  console.log('USUARIO COMPLETO:', user);

  const rol = this.auth.roleOf(user);

  console.log('ROL FINAL:', rol);

  if (rol === 'admin' || rol === 'administrador') {
    console.log('REDIRIGIENDO A DASHBOARD ADMIN');
    this.router.navigate(['/dash/overview']);
    return;
  }

  if (rol === 'conductor' || rol === 'driver') {
    console.log('REDIRIGIENDO A PANEL CONDUCTOR');
    this.router.navigate(['/conductor']);
    return;
  }

  console.log('ROL DESCONOCIDO');

  this.auth.logout();
  this.error = 'No tienes permisos para ingresar.';
},

      error: () => {
        this.cargando = false;
        this.error = 'Email o contraseña incorrectos.';
      }
    });
  }

  togglePass(): void {
    this.showPass = !this.showPass;
  }
}