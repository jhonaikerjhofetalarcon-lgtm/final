import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, AsientoDto, ReservaCreatePayload, DestinoDto, AutoDto } from '../../core/g7-api.service';

interface Pasajero {
  nombre: string;
  apellido: string;
  dni: number;
  email: string;
  telefono: string;
}

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
})
export class Reservas implements OnInit {
  private api = inject(G7ApiService);

  destinos: DestinoDto[] = [];
  destinoSeleccionado: DestinoDto | null = null;
  autoSeleccionado: AutoDto | null = null;

  asientos: AsientoDto[] = [];
  asientosFilas: AsientoDto[][] = [];
  copiloto: AsientoDto | null = null;

  asientosSeleccionados: AsientoDto[] = [];
  pasajeros: Pasajero[] = [];

  mostrarModal = false;
  enviado = false;
  cargando = false;
  errorApi: string | null = null;
  reservasConfirmadas = 0;

  ngOnInit() {
    this.cargarDestinos();
  }

  cargarDestinos() {
    this.api.getDestinos().subscribe({
      next: (data) => this.destinos = data,
      error: () => this.errorApi = 'Error al cargar destinos'
    });
  }

  async onDestinoChange() {
    if (!this.destinoSeleccionado) {
      this.resetearSeleccion();
      return;
    }

    this.cargando = true;
    this.errorApi = null;

    try {
      // Cargar vehículo asignado al destino
      const autos = await this.api.getAutos().toPromise() || [];
      this.autoSeleccionado = autos.find(a => a.id === this.destinoSeleccionado!.idAuto) || null;

      // Cargar solo asientos de ese vehículo
      const todosAsientos = await this.api.getAsientos().toPromise() || [];
      this.asientos = todosAsientos.filter(a => a.idAuto === this.destinoSeleccionado!.idAuto);

      // Separar copiloto
      this.copiloto = this.asientos.find(a => 
        a.numeroAsiento?.toUpperCase().includes('C') || 
        a.numeroAsiento === '1' || 
        a.numeroAsiento === '01'
      ) || null;

      const restantes = this.asientos.filter(a => a.id !== this.copiloto?.id);
      this.asientosFilas = [];
      for (let i = 0; i < restantes.length; i += 4) {
        this.asientosFilas.push(restantes.slice(i, i + 4));
      }

    } catch (e) {
      this.errorApi = 'Error al cargar el vehículo y asientos';
      console.error(e);
    } finally {
      this.cargando = false;
    }
  }

  private resetearSeleccion() {
    this.autoSeleccionado = null;
    this.asientos = [];
    this.asientosFilas = [];
    this.copiloto = null;
    this.asientosSeleccionados = [];
  }

  toggleAsiento(asiento: AsientoDto) {
    if (asiento.estado !== 'libre') return;

    const index = this.asientosSeleccionados.findIndex(a => a.id === asiento.id);
    if (index >= 0) {
      this.asientosSeleccionados.splice(index, 1);
      asiento.estado = 'libre';
    } else {
      this.asientosSeleccionados.push(asiento);
      asiento.estado = 'reservado';
    }
  }

  abrirFormularioPasajeros() {
    if (this.asientosSeleccionados.length === 0 || !this.destinoSeleccionado) return;

    this.pasajeros = this.asientosSeleccionados.map(() => ({
      nombre: '', 
      apellido: '', 
      dni: 0, 
      email: '', 
      telefono: ''
    }));

    this.mostrarModal = true;
  }

  cancelarModal() {
    this.mostrarModal = false;
    this.asientosSeleccionados.forEach(a => a.estado = 'libre');
    this.asientosSeleccionados = [];
  }

  async confirmarReservas() {
    if (!this.destinoSeleccionado || this.pasajeros.length === 0) return;

    this.cargando = true;

    try {
      for (let i = 0; i < this.asientosSeleccionados.length; i++) {
        const p = this.pasajeros[i];
        const asiento = this.asientosSeleccionados[i];

        const payload: ReservaCreatePayload = {
          nombre: p.nombre,
          apellido: p.apellido,
          email: p.email,
          telefono: p.telefono,
          destino: this.destinoSeleccionado.name || this.destinoSeleccionado.title,
          fechaIda: '2026-06-15',
          fechaVuelta: '2026-06-20',
          dni: p.dni,
          clase: 'economica',
          notas: `Asiento ${asiento.numeroAsiento} - ${this.destinoSeleccionado.title}`,
        };

        await this.api.createReserva(payload).toPromise();
      }

      this.reservasConfirmadas = this.asientosSeleccionados.length;
      this.enviado = true;
    } catch (error) {
      this.errorApi = 'Error al confirmar la reserva';
      console.error(error);
    } finally {
      this.cargando = false;
    }
  }

  nuevaReserva() {
    this.enviado = false;
    this.asientosSeleccionados = [];
    this.pasajeros = [];
    this.mostrarModal = false;
    this.destinoSeleccionado = null;
    this.autoSeleccionado = null;
  }
}