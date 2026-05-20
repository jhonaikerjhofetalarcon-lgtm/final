import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, AutoDto, UserDto } from '../../core/g7-api.service';

@Component({
  selector: 'app-autos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autos.html',
  styleUrls: ['./autos.css'],
})
export class Autos implements OnInit {
  private api = inject(G7ApiService);

  busqueda = '';
  formVisible = false;
  editingId: string | null = null;

  autos: AutoDto[] = [];
  conductores: UserDto[] = [];   // ← Nuevos conductores

  fAuto: any = this.emptyAuto();

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    // Cargar vehículos
    this.api.getAutos().subscribe({
      next: (data) => this.autos = data,
      error: () => console.error('Error al cargar vehículos')
    });

    // Cargar conductores (usuarios con rol 'conductor')
    this.api.getUsers().subscribe({
      next: (users) => {
        this.conductores = users.filter(u => u.rol === 'conductor');
      },
      error: () => console.error('Error al cargar conductores')
    });
  }

  abrirNuevo() {
    this.editingId = null;
    this.fAuto = this.emptyAuto();
    this.formVisible = true;
  }

  editar(auto: AutoDto) {
    this.editingId = auto.id;
    this.fAuto = { ...auto };
    this.formVisible = true;
  }

  guardar() {
    if (!this.fAuto.placa?.trim() || !this.fAuto.marca?.trim()) {
      alert('Placa y Marca son obligatorios');
      return;
    }

    const payload = { ...this.fAuto };
    delete payload.id; // No enviar id en create

    const operacion = this.editingId
      ? this.api.updateAuto(this.editingId, payload)
      : this.api.createAuto(payload);

    operacion.subscribe({
      next: () => {
        this.flash('✅ Vehículo guardado correctamente');
        this.cerrarForm();
        this.cargarTodo();
      },
      error: (err) => {
        console.error(err);
        alert('Error al guardar el vehículo');
      }
    });
  }

  eliminar(auto: AutoDto) {
    if (!confirm(`¿Eliminar el vehículo ${auto.placa}?`)) return;
    this.api.deleteAuto(auto.id).subscribe({
      next: () => this.cargarTodo(),
      error: () => alert('No se pudo eliminar')
    });
  }

  cerrarForm() {
    this.formVisible = false;
    this.editingId = null;
  }

  filtrados() {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) return this.autos;

    return this.autos.filter(a =>
      a.placa.toLowerCase().includes(q) ||
      a.marca.toLowerCase().includes(q) ||
      a.modelo?.toLowerCase().includes(q) ||
      a.conductor?.toLowerCase().includes(q)
    );
  }

  private flash(msg: string) {
    // Puedes mejorar esto con un mensaje temporal si quieres
    console.log(msg);
  }

  private emptyAuto() {
    return {
      placa: '',
      marca: '',
      modelo: '',
      color: '',
      anioFabrica: new Date().getFullYear(),
      cantidadAsiento: 15,
      tipo: 'minivan',
      conductor: '',
      estado: 'activo'
    };
  }
}