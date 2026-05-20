import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, AsientoDto, AsientoCreatePayload, AutoDto } from '../../core/g7-api.service';

@Component({
  selector: 'app-asientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asientos.html',
  styleUrls: ['./asientos.css'],
})
export class Asientos implements OnInit {
  private api = inject(G7ApiService);

  busqueda = '';
  formVisible = false;
  editingId: string | null = null;

  asientos: AsientoDto[] = [];
  autos: AutoDto[] = [];

  fAsiento: AsientoCreatePayload = { idAuto: '', numeroAsiento: '', estado: 'libre' };

  ngOnInit() {
    this.cargarTodo();
  }

  async cargarTodo() {
    this.asientos = await this.api.getAsientos().toPromise() || [];
    this.autos = await this.api.getAutos().toPromise() || [];
  }

  abrirNuevo() {
    this.editingId = null;
    this.fAsiento = { idAuto: '', numeroAsiento: '', estado: 'libre' };
    this.formVisible = true;
  }

  editar(s: AsientoDto) {
    this.editingId = s.id;
    this.fAsiento = {
      idAuto: s.idAuto,
      numeroAsiento: s.numeroAsiento,
      estado: s.estado
    };
    this.formVisible = true;
  }

  async guardar() {
    if (!this.fAsiento.idAuto || !this.fAsiento.numeroAsiento?.trim()) {
      alert('Vehículo y número de asiento son obligatorios');
      return;
    }

    try {
      if (this.editingId) {
        // Actualizar
        await this.api.updateAsiento?.(this.editingId, this.fAsiento).toPromise(); // Asegúrate que exista este método en el servicio
      } else {
        // Crear
        await this.api.createAsiento(this.fAsiento).toPromise();
      }
      this.cerrarForm();
      this.cargarTodo();
    } catch (e) {
      alert('Error al guardar el asiento');
    }
  }

  cerrarForm() {
    this.formVisible = false;
    this.editingId = null;
  }

  liberar(s: AsientoDto) {
    if (confirm('¿Liberar este asiento?')) {
      this.api.liberarAsiento(s.id).subscribe(() => this.cargarTodo());
    }
  }

  eliminar(s: AsientoDto) {
    if (confirm(`¿Eliminar asiento ${s.numeroAsiento}?`)) {
      this.api.deleteAsiento(s.id).subscribe(() => this.cargarTodo());
    }
  }

  filtrados() {
    const q = this.busqueda.toLowerCase();
    return q ? this.asientos.filter(s => 
      s.numeroAsiento.toLowerCase().includes(q)
    ) : this.asientos;
  }

  placaDeAuto(idAuto: string): string {
    return this.autos.find(a => a.id === idAuto)?.placa ?? '—';
  }
}