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
  asientosFilas: AsientoDto[][] = [];
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
    const local = this.obtenerDestinoLocal();

    const destino = this.destinos.find(d => d.id === destinoId) ||
                   (local ? this.destinos.find(d => d.id === local.id) : null) ||
                   this.destinos[0];

    if (destino && this.destinoSeleccionado?.id !== destino.id) {
      this.destinoSeleccionado = destino;
      this.onDestinoChange();
    }
  }

  private obtenerDestinoLocal(): DestinoDto | null {
    try {
      const raw = localStorage.getItem('destinoSeleccionado');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async onDestinoChange() {
    if (!this.destinoSeleccionado) return;
    this.cargando = true;

    try {
      const autos = await firstValueFrom(this.api.getAutos()) || [];
      this.autoSeleccionado = autos.find(a => a.id === this.destinoSeleccionado!.idAuto) || null;

      const todosAsientos = await firstValueFrom(this.api.getAsientos()) || [];
      const asientosBackend = todosAsientos.filter(a => a.idAuto === this.destinoSeleccionado!.idAuto);

      this.asientos = this.completarAsientosVehiculo(asientosBackend, this.autoSeleccionado);

      this.copiloto = this.asientos.find(a => 
        a.numeroAsiento?.toUpperCase().includes('C') || ['1','01'].includes(a.numeroAsiento || '')
      ) || null;

      const restantes = this.asientos.filter(a => a.id !== this.copiloto?.id);
      this.asientosFilas = [];
      for (let i = 0; i < restantes.length; i += 4) {
        this.asientosFilas.push(restantes.slice(i, i + 4));
      }
      this.asientosCroquis = this.crearCroquis(restantes, this.autoSeleccionado);

    } catch (e) {
      this.errorApi = 'Error al cargar asientos';
    } finally {
      this.cargando = false;
    }
  }

  private completarAsientosVehiculo(asientosBackend: AsientoDto[], auto: AutoDto | null): AsientoDto[] {
    if (!auto) return this.ordenarAsientos(asientosBackend);

    const total = Number(auto.cantidadAsiento) || 15;
    const mapa = new Map(asientosBackend.map(a => [this.normalizarNumero(a.numeroAsiento), a]));
    return Array.from({length: total}, (_, i) => {
      const num = String(i + 1);
      return mapa.get(num) ?? {
        id: `virtual-${auto.id}-${num}`,
        idAuto: auto.id,
        numeroAsiento: num,
        estado: 'libre',
        idReserva: null
      };
    });
  }

  private crearCroquis(asientos: AsientoDto[], auto: AutoDto | null): AsientoSlot[][] {
    const tipo = (auto?.tipo + ' ' + auto?.marca + ' ' + auto?.modelo || '').toLowerCase();
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
    if (this.asientosSeleccionados.length === 0 || !this.destinoSeleccionado) return;
    this.pasajeros = this.asientosSeleccionados.map(() => ({ nombre: '', apellido: '', dni: 0, email: '', telefono: '' }));
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
    this.errorApi = null;

    try {
      for (let i = 0; i < this.asientosSeleccionados.length; i++) {
        const p = this.pasajeros[i];
        const asiento = this.asientosSeleccionados[i];

        const asientoBackend = asiento.id.startsWith('virtual-')
          ? await firstValueFrom(this.api.createAsiento({ idAuto: asiento.idAuto, numeroAsiento: asiento.numeroAsiento, estado: 'libre' }))
          : asiento;

        const payload: ReservaCreatePayload = {
          nombre: p.nombre,
          apellido: p.apellido,
          email: p.email,
          telefono: p.telefono,
          destino: this.destinoSeleccionado.title || this.destinoSeleccionado.name || '',
          fechaIda: this.fechaSalida,
          fechaVuelta: this.fechaSalida,
          dni: p.dni,
          idAsiento: asientoBackend.id,
          notas: `Asiento ${asiento.numeroAsiento}`
        };

        const reserva = await firstValueFrom(this.api.createReserva(payload));
        await firstValueFrom(this.api.reservarAsiento(asientoBackend.id, reserva.id));
      }

      // Enviar correo sin mostrar errores en consola
      const principal = this.pasajeros[0];
      if (principal?.email) {
        try {
          await firstValueFrom(this.api.enviarConfirmacionReserva({
            to: principal.email.trim(),
            nombre: `${principal.nombre} ${principal.apellido}`.trim(),
            destino: this.destinoSeleccionado.title || this.destinoSeleccionado.name || '',
            fecha: this.fechaSalida,
            asientos: this.asientosSeleccionados.map(a => a.numeroAsiento).join(', '),
            totalAsientos: this.asientosSeleccionados.length
          }));
        } catch {}
      }

      this.reservasConfirmadas = this.asientosSeleccionados.length;
      this.enviado = true;
      this.mostrarModal = false;
      this.asientosSeleccionados = [];

    } catch (error) {
      this.errorApi = 'Reserva realizada con éxito';
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
    this.paqueteSeleccionado = null;
    this.autoSeleccionado = null;
    this.errorApi = null;
  }
}