import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { G7ApiService, AsientoDto, ReservaCreatePayload, DestinoDto, AutoDto, PaqueteDto } from '../../core/g7-api.service';
import { firstValueFrom } from 'rxjs';

interface Pasajero {
  nombre: string;
  apellido: string;
  dni: number;
  email: string;
  telefono: string;
  origen: string;           // ← NUEVO
}

type AsientoSlot = AsientoDto | null;

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
})
export class Reservas implements OnInit {
  private api = inject(G7ApiService);
  private route = inject(ActivatedRoute);

  destinos: DestinoDto[] = [];
  destinoSeleccionado: DestinoDto | null = null;
  paqueteSeleccionado: PaqueteDto | null = null;
  autoSeleccionado: AutoDto | null = null;

  asientos: AsientoDto[] = [];
  asientosCroquis: AsientoSlot[][] = [];
  copiloto: AsientoDto | null = null;

  asientosSeleccionados: AsientoDto[] = [];
  pasajeros: Pasajero[] = [];

  mostrarModal = false;
  enviado = false;
  cargando = false;
  errorApi: string | null = null;
  reservasConfirmadas = 0;
  fechaSalida = '2026-06-15';

  numeroPersonas: number = 0;

  ngOnInit() {
    this.cargarDestinos();
    this.cargarPaqueteDesdeUrl();
  }

  cargarDestinos() {
    this.api.getDestinos().subscribe({
      next: (data) => {
        this.destinos = data;
        this.preseleccionarDestino();
      },
      error: () => this.errorApi = 'Error al cargar destinos'
    });
  }

  private cargarPaqueteDesdeUrl() {
    const paqueteId = this.route.snapshot.queryParamMap.get('paqueteId');
    if (!paqueteId) return;
    this.api.getPaquete(paqueteId).subscribe({
      next: (p) => this.paqueteSeleccionado = p,
      error: () => {}
    });
  }

  private preseleccionarDestino() {
    if (!this.destinos.length) return;
    const destinoId = this.route.snapshot.queryParamMap.get('destinoId');
    const destino = this.destinos.find(d => d.id === destinoId) || this.destinos[0];

    if (destino) {
      this.destinoSeleccionado = destino;
      this.onDestinoChange();
    }
  }

  onDestinoChange() {
    this.numeroPersonas = 0;
    this.autoSeleccionado = null;
    this.asientosSeleccionados = [];
    this.asientosCroquis = [];
    this.copiloto = null;
  }

  asignarVehiculoSegunPersonas() {
    if (!this.destinoSeleccionado || this.numeroPersonas <= 0) {
      this.autoSeleccionado = null;
      this.asientosCroquis = [];
      this.copiloto = null;
      return;
    }

    this.cargando = true;
    this.errorApi = null;

    this.api.getAutos().subscribe({
      next: (autos) => {
        let autoFiltrado: AutoDto | null = null;

        if (this.numeroPersonas <= 4) {
          autoFiltrado = autos.find(a => 
            (a.marca?.toLowerCase() || '').includes('toyota') && (a.cantidadAsiento || 0) <= 5
          ) || autos.find(a => (a.cantidadAsiento || 0) <= 5) || null;
        } else {
          autoFiltrado = autos.find(a => {
            const tipo = (a.tipo?.toLowerCase() || '');
            const modelo = (a.modelo?.toLowerCase() || '');
            return ['minivan', 'combi', 'hiace', 'master'].some(t => tipo.includes(t) || modelo.includes(t));
          }) || autos.find(a => (a.cantidadAsiento || 0) >= 10) || null;
        }

        this.autoSeleccionado = autoFiltrado;

        if (this.autoSeleccionado) {
          this.cargarAsientosDelVehiculo(this.autoSeleccionado);
        } else {
          this.errorApi = 'No se encontró vehículo disponible para esa cantidad de personas.';
        }
      },
      error: () => this.errorApi = 'Error al cargar vehículos',
      complete: () => this.cargando = false
    });
  }

  private cargarAsientosDelVehiculo(auto: AutoDto) {
    if (!auto || !auto.id) return;

    this.api.getAsientos().subscribe({
      next: (todosAsientos) => {
        const asientosBackend = todosAsientos.filter(a => a.idAuto === auto.id);
        this.asientos = this.completarAsientosVehiculo(asientosBackend, auto);

        this.copiloto = this.asientos.find(a => 
          a?.numeroAsiento?.toUpperCase().includes('C') || ['1', '01'].includes(a?.numeroAsiento || '')
        ) || null;

        const restantes = this.asientos.filter(a => a.id !== this.copiloto?.id);
        this.asientosCroquis = this.crearCroquis(restantes, auto);
      }
    });
  }

  private completarAsientosVehiculo(asientosBackend: AsientoDto[], auto: AutoDto | null): AsientoDto[] {
    if (!auto) return asientosBackend;

    const total = Number(auto.cantidadAsiento) || 15;
    const mapa = new Map(asientosBackend.map(a => [this.normalizarNumero(a.numeroAsiento), a]));

    return Array.from({length: total}, (_, i) => {
      const num = String(i + 1);
      return mapa.get(num) ?? {
        id: `virtual-${auto.id}-${num}`,
        idAuto: auto.id,
        numeroAsiento: num,
        estado: 'libre' as const,
        idReserva: null
      };
    });
  }

  private crearCroquis(asientos: AsientoDto[], auto: AutoDto | null): AsientoSlot[][] {
    const tipo = ((auto?.tipo || '') + ' ' + (auto?.marca || '') + ' ' + (auto?.modelo || '')).toLowerCase();
    if (tipo.includes('minivan') || tipo.includes('master') || tipo.includes('hiace')) {
      return this.crearCroquisMinivan15(asientos);
    }
    const ordenados = this.ordenarAsientos(asientos);
    const filas: AsientoSlot[][] = [];
    for (let i = 0; i < ordenados.length; i += 4) {
      filas.push(ordenados.slice(i, i + 4));
    }
    return filas;
  }

  private crearCroquisMinivan15(asientos: AsientoDto[]): AsientoSlot[][] {
    const mapa = new Map(asientos.map(a => [this.normalizarNumero(a.numeroAsiento), a]));
    const asiento = (n: number) => mapa.get(String(n)) ?? null;
    return [
      [asiento(2), asiento(3), null, asiento(4)],
      [asiento(5), asiento(6), null, asiento(7)],
      [asiento(8), asiento(9), null, asiento(10)],
      [asiento(11), asiento(12), null, asiento(13)],
      [asiento(14), null, null, asiento(15)],
    ].filter(f => f.some(Boolean));
  }

  private ordenarAsientos(asientos: AsientoDto[]): AsientoDto[] {
    return [...asientos].sort((a, b) => Number(this.normalizarNumero(a.numeroAsiento)) - Number(this.normalizarNumero(b.numeroAsiento)));
  }

  private normalizarNumero(num: string): string {
    return String(num || '').replace(/\D/g, '');
  }

  toggleAsiento(asiento: AsientoDto) {
    if (asiento.estado !== 'libre') return;
    const idx = this.asientosSeleccionados.findIndex(a => a.id === asiento.id);
    if (idx >= 0) {
      this.asientosSeleccionados.splice(idx, 1);
      asiento.estado = 'libre';
    } else {
      this.asientosSeleccionados.push(asiento);
      asiento.estado = 'reservado';
    }
  }

  abrirFormularioPasajeros() {
    if (this.asientosSeleccionados.length === 0) return;
    this.pasajeros = this.asientosSeleccionados.map(() => ({
      nombre: '', apellido: '', dni: 0, email: '', telefono: '', origen: ''
    }));
    this.mostrarModal = true;
  }

  cancelarModal() {
    this.mostrarModal = false;
    this.asientosSeleccionados.forEach(a => a.estado = 'libre');
    this.asientosSeleccionados = [];
  }

  async confirmarReservas() {
    if (!this.destinoSeleccionado || this.asientosSeleccionados.length === 0) return;

    this.cargando = true;
    this.errorApi = null;

    try {
      for (let i = 0; i < this.asientosSeleccionados.length; i++) {
        const p = this.pasajeros[i];
        const asiento = this.asientosSeleccionados[i];

        const asientoBackend = asiento.id.startsWith('virtual-')
          ? await firstValueFrom(this.api.createAsiento({ 
              idAuto: asiento.idAuto, 
              numeroAsiento: asiento.numeroAsiento, 
              estado: 'libre' 
            }))
          : asiento;

        const payload = {
          nombre: p.nombre,
          apellido: p.apellido,
          email: p.email,
          telefono: p.telefono,
          origen: p.origen,                    // ← NUEVO
          destino: this.destinoSeleccionado.title || '',
          fechaIda: this.fechaSalida,
          fechaVuelta: this.fechaSalida,
          dni: p.dni,
          idAsiento: asientoBackend.id,
          notas: `Asiento ${asiento.numeroAsiento}`
        };

        const reserva = await firstValueFrom(this.api.createReserva(payload));
        await firstValueFrom(this.api.reservarAsiento(asientoBackend.id, reserva.id));
      }

      this.reservasConfirmadas = this.asientosSeleccionados.length;
      this.enviado = true;
      this.mostrarModal = false;
      this.asientosSeleccionados = [];

    } catch (error) {
      console.error(error);
      this.errorApi = 'Error al confirmar la reserva';
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
    this.numeroPersonas = 0;
    this.errorApi = null;
  }
}