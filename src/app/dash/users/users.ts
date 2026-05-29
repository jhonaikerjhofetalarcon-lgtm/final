import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, UserDto } from '../../core/g7-api.service';

interface UserForm {
  nombre: string;
  email: string;
  telefono: string;
  rol: 'admin' | 'conductor';
  password?: string;

  licencia?: string;
  tipoLicencia?: string;
  fechaVencimientoLicencia?: string;
  experienciaAnios?: number;
  tipoVehiculo?: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class Users implements OnInit {
  private readonly api = inject(G7ApiService);

  busqueda = '';
  error: string | null = null;
  successMsg: string | null = null;
  formVisible = false;
  editingId: string | null = null;

  usuarios: UserDto[] = [];
  fUsuario: UserForm = this.empty();

  ngOnInit(): void { 
    this.cargar(); 
  }

  cargar(): void {
    this.api.getUsers().subscribe({
      next: (d) => this.usuarios = d,
      error: () => this.error = 'Error al cargar usuarios'
    });
  }

  abrir(): void {
    this.editingId = null;
    this.fUsuario = this.empty();
    this.formVisible = true;
    this.error = null;
  }

  abrirEditar(u: UserDto): void {
    this.editingId = u.id;
    this.fUsuario = {
      nombre: u.nombre || '',
      email: u.email || '',
      telefono: u.telefono || '',
      rol: u.rol || 'conductor',
      password: '',
      licencia: u.licencia || '',
      tipoLicencia: u.tipoLicencia || '',
      fechaVencimientoLicencia: u.fechaVencimientoLicencia || '',
      experienciaAnios: u.experienciaAnios || 0,
      tipoVehiculo: u.tipoVehiculo || ''
    };
    this.formVisible = true;
    this.error = null;
  }

  guardar(): void {
    const { nombre, email, telefono, rol, password, licencia, tipoLicencia, fechaVencimientoLicencia, experienciaAnios, tipoVehiculo } = this.fUsuario;

    if (!nombre?.trim() || !email?.trim() || !telefono?.trim()) {
      this.error = 'Nombre, email y teléfono son obligatorios.';
      return;
    }

    if (!this.editingId && (!password || password.trim().length < 6)) {
      this.error = 'La contraseña es obligatoria (mínimo 6 caracteres).';
      return;
    }

    this.error = null;

    const body: any = {
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      rol: rol
    };

    if (password && password.trim()) {
      body.password = password.trim();
    }

    if (rol === 'conductor') {
      body.licencia = licencia?.trim() || '';
      body.tipoLicencia = tipoLicencia?.trim() || '';
      body.fechaVencimientoLicencia = fechaVencimientoLicencia || null;
      body.experienciaAnios = experienciaAnios || 0;
      body.tipoVehiculo = tipoVehiculo?.trim() || '';
    }

    if (this.editingId) {
      this.api.updateUser(this.editingId, body).subscribe({
        next: () => {
          this.cerrar();
          this.cargar();
          this.flash('✅ Usuario actualizado correctamente');
        },
        error: (err) => this.error = err?.error?.message || 'Error al actualizar usuario'
      });
    } else {
      this.api.createUser(body).subscribe({
        next: () => {
          this.cerrar();
          this.cargar();
          this.flash('✅ Usuario creado correctamente');
        },
        error: (err) => this.error = err?.error?.message || 'Error al crear usuario'
      });
    }
  }

  eliminar(u: UserDto): void {
    if (!u.id) {
      this.error = 'No se pudo identificar el usuario';
      return;
    }
    if (!confirm(`¿Eliminar a "${u.nombre}"?`)) return;

    this.api.deleteUser(u.id).subscribe({
      next: () => { 
        this.cargar(); 
        this.flash('🗑 Usuario eliminado'); 
      },
      error: () => this.error = 'No se pudo eliminar el usuario'
    });
  }

  filtrados(): UserDto[] {
    const q = this.busqueda.toLowerCase().trim();
    return q ? this.usuarios.filter(u =>
      u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ) : this.usuarios;
  }

  totalAdmins(): number { 
    return this.usuarios.filter(u => u.rol === 'admin').length; 
  }
  
  totalConductores(): number { 
    return this.usuarios.filter(u => u.rol === 'conductor').length; 
  }

  avatarColor(nombre: string): string {
    const colors = ['#c0392b','#2980b9','#27ae60','#8e44ad','#d35400','#16a085'];
    return colors[nombre?.charCodeAt(0) % colors.length] ?? '#64748b';
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = null), 3000);
  }

  private empty(): UserForm {
    return { 
      nombre: '', 
      email: '', 
      telefono: '', 
      rol: 'conductor', 
      password: '',
      licencia: '',
      tipoLicencia: '',
      fechaVencimientoLicencia: '',
      experienciaAnios: 0,
      tipoVehiculo: ''
    };
  }

  cerrar(): void {
    this.formVisible = false;
    this.editingId = null;
    this.error = null;
  }
}