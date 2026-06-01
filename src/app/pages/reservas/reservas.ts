import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { G7ApiService, AsientoDto, DestinoDto, AutoDto, PaqueteDto, ReservaDto } from '../../core/g7-api.service';
import { firstValueFrom } from 'rxjs';

interface Pasajero {
  nombre: string;
  apellido: string;
  dni: number;
  email: string;
  telefono: string;
  origen: string;
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
  autoSeleccionado: AutoDto | null = null;
  autosDisponibles: AutoDto[] = [];

  asientos: AsientoDto[] = [];
  asientosCroquis: AsientoSlot[][] = [];
  copiloto: AsientoDto | null = null;
  reservas: ReservaDto[] = [];

  asientosSeleccionados: AsientoDto[] = [];
  pasajeros: Pasajero[] = [];

  mostrarModal = false;
  enviado = false;
  cargando = false;
  errorApi: string | null = null;
  reservasConfirmadas = 0;
  fechaSalida = '2026-06-15';
  numeroPersonas = 0;

  ngOnInit() {
    this.cargarReservas();
    this.cargarDestinos();
  }

  cargarDestinos() {
    this.api.getDestinos().subscribe({
      next: (data) => {
        this.destinos = data?.length ? data : this.getDestinosRespaldo();
        this.preseleccionarDestino();
      },
      error: () => {
        this.destinos = this.getDestinosRespaldo();
        this.errorApi = 'Backend no disponible. Mostrando destinos de respaldo.';
        this.preseleccionarDestino();
      }
    });
  }

  private cargarReservas() {
    this.api.getReservas().subscribe({
      next: (data) => this.reservas = data || [],
      error: () => this.reservas = []
    });
  }

  private cargarPaqueteDesdeUrl() {
    // Sin usar paquetes
  }

  onDestinoChange() {
    this.numeroPersonas = 0;
    this.autoSeleccionado = null;
    this.autosDisponibles = [];
    this.asientosSeleccionados = [];
    this.asientos = [];
    this.asientosCroquis = [];
    this.copiloto = null;
    this.cargarCarrosDisponibles();
  }

  onNumeroPersonasChange() {
    this.asientosSeleccionados.forEach(a => a.estado = 'libre');
    this.asientosSeleccionados = [];
  }

  totalPersonasReserva(): number {
    return Number(this.numeroPersonas) > 0
      ? Number(this.numeroPersonas)
      : this.asientosSeleccionados.length;
  }

  cargarCarrosDisponibles() {
    if (!this.destinoSeleccionado) {
      this.autoSeleccionado = null;
      this.autosDisponibles = [];
      this.asientosCroquis = [];
      this.copiloto = null;
      return;
    }

    this.cargando = true;
    this.errorApi = null;

    this.api.getAutos().subscribe({
      next: (autos) => {
        const idsDestino = this.destinoSeleccionado?.idAutos || [];
        this.autosDisponibles = idsDestino.length > 0
          ? autos
              .filter(a => idsDestino.some(id => this.autoCoincideConDestino(id, a)))
              .filter(a => this.esCarroPermitido(a))
              .sort((a, b) => (a.cantidadAsiento || 0) - (b.cantidadAsiento || 0))
          : [];

        if (!this.autosDisponibles.length) {
          this.errorApi = 'No hay carros disponibles para este destino.';
        }
      },
      error: () => this.errorApi = 'Error al cargar carros disponibles',
      complete: () => this.cargando = false
    });
  }

  seleccionarCarro() {
    this.asientosSeleccionados.forEach(a => a.estado = 'libre');
    this.asientosSeleccionados = [];
    this.asientos = [];
    this.asientosCroquis = [];
    this.copiloto = null;

    if (this.autoSeleccionado) {
      this.cargarAsientosDelVehiculo(this.autoSeleccionado);
    }
  }

  onFechaSalidaChange() {
    if (!this.autoSeleccionado) return;
    this.asientosSeleccionados.forEach(a => a.estado = 'libre');
    this.asientosSeleccionados = [];
    this.cargarAsientosDelVehiculo(this.autoSeleccionado);
  }

  private esCarroPermitido(auto: AutoDto): boolean {
    const texto = `${auto.marca || ''} ${auto.modelo || ''} ${auto.tipo || ''}`.toLowerCase();
    const asientos = Number(auto.cantidadAsiento) || 0;

    return (
      (texto.includes('renault') && texto.includes('master')) ||
      texto.includes('sprinter') ||
      texto.includes('microbus') ||
      texto.includes('micro bus') ||
      asientos === 15 ||
      asientos === 18 ||
      asientos === 25
    );
  }

  private cargarAsientosDelVehiculo(auto: AutoDto) {
    if (!auto || !auto.id) return;

    this.api.getAsientos().subscribe({
      next: (todosAsientos) => {
        const asientosBackend = todosAsientos.filter(a => a.idAuto === auto.id);
        const asientosCargados = this.completarAsientosVehiculo(asientosBackend, auto);
        this.asientos = this.aplicarReservasPorFecha(asientosCargados);

        this.copiloto = this.asientos.find(a =>
          a?.numeroAsiento?.toUpperCase().includes('C') || ['1', '01'].includes(a?.numeroAsiento || '')
        ) || null;

        const restantes = this.asientos.filter(a => a.id !== this.copiloto?.id);
        this.asientosCroquis = this.crearCroquis(restantes, auto);
      },
      error: () => this.errorApi = 'Error al cargar asientos'
    });
  }

  private completarAsientosVehiculo(asientosBackend: AsientoDto[], auto: AutoDto | null): AsientoDto[] {
    if (!auto) return asientosBackend;

    const total = Number(auto.cantidadAsiento) || 15;
    const mapa = new Map(asientosBackend.map(a => [this.normalizarNumero(a.numeroAsiento), a]));

    return Array.from({ length: total }, (_, i) => {
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
    if (tipo.includes('master') || Number(auto?.cantidadAsiento) === 15) {
      return this.crearCroquisMinivan15(asientos);
    }

    const ordenados = this.ordenarAsientos(asientos);
    const filas: AsientoSlot[][] = [];
    for (let i = 0; i < ordenados.length; i += 4) {
      filas.push(ordenados.slice(i, i + 4));
    }
    return filas;
  }

  private aplicarReservasPorFecha(asientos: AsientoDto[]): AsientoDto[] {
    const fechaSeleccionada = String(this.fechaSalida || '').slice(0, 10);
    const reservasEnFecha = new Map(
      this.reservas
        .filter(r => String(r.fechaIda || '').slice(0, 10) === fechaSeleccionada)
        .map(r => [r.idAsiento, r.id])
    );

    return asientos.map(asiento => {
      if (!asiento) return asiento;
      if (asiento.estado === 'ocupado') return asiento;

      const reservaId = reservasEnFecha.get(asiento.id);
      if (reservaId) {
        return { ...asiento, estado: 'reservado', idReserva: reservaId };
      }

      return { ...asiento, estado: 'libre', idReserva: null };
    });
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

  private autoCoincideConDestino(idDestino: string, auto: AutoDto): boolean {
    const valor = String(idDestino || '').trim().toLowerCase();
    if (!valor) return false;
    const idAuto = String(auto.id || '').trim().toLowerCase();
    const placa = String(auto.placa || '').trim().toLowerCase();
    const modelo = `${auto.marca || ''} ${auto.modelo || ''}`.trim().toLowerCase();
    return idAuto === valor || placa === valor || modelo === valor;
  }

  toggleAsiento(asiento: AsientoDto) {
    const idx = this.asientosSeleccionados.findIndex(a => a.id === asiento.id);
    const limite = Number(this.numeroPersonas) || 0;

    if (idx >= 0) {
      this.asientosSeleccionados.splice(idx, 1);
      asiento.estado = 'libre';
      return;
    }

    if (asiento.estado !== 'libre') {
      return;
    } else {
      if (limite > 0 && this.asientosSeleccionados.length >= limite) return;
      this.asientosSeleccionados.push(asiento);
      asiento.estado = 'reservado';
    }
  }

  abrirFormularioPasajeros() {
    const totalPersonas = this.totalPersonasReserva();
    if (this.asientosSeleccionados.length === 0 || this.asientosSeleccionados.length !== totalPersonas) return;

    this.numeroPersonas = totalPersonas;
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
          origen: p.origen,
          destino: this.destinoSeleccionado.title || '',
          fechaIda: this.fechaSalida,
          fechaVuelta: this.fechaSalida,
          dni: p.dni,
          idAsiento: asientoBackend.id,
          notas: `Asiento ${asiento.numeroAsiento} - ${this.autoSeleccionado?.marca || ''} ${this.autoSeleccionado?.modelo || ''}`.trim()
        };

        const reserva = await firstValueFrom(this.api.createReserva(payload));
        await firstValueFrom(this.api.reservarAsiento(asientoBackend.id, reserva.id));
      }

      this.reservasConfirmadas = this.asientosSeleccionados.length;
      this.enviado = true;
      this.mostrarModal = false;
      this.asientosSeleccionados = [];
      this.cargarReservas();
      if (this.autoSeleccionado) {
        this.cargarAsientosDelVehiculo(this.autoSeleccionado);
      }

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
    this.autosDisponibles = [];
    this.asientos = [];
    this.asientosCroquis = [];
    this.copiloto = null;
    this.numeroPersonas = 0;
    this.errorApi = null;
  }

  private getDestinosRespaldo(): DestinoDto[] {
    return [
      {
        id: 'respaldo-millpu',
        label: 'Full Day',
        title: 'Aguas Turquesas de Millpu',
        desc: 'Ruta natural desde Ayacucho hacia piscinas turquesas. Full day desde S/. 110 por persona.',
        name: 'Desde S/. 110',
        bg: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg',
        thumb: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg',
        idAutos: []
      },
      {
        id: 'respaldo-city-tour',
        label: 'Half Day',
        title: 'Ayacucho City Tour',
        desc: 'Recorrido por plazas, templos, miradores y casonas historicas. Desde S/. 50 por persona.',
        name: 'Desde S/. 50',
        bg: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg',
        thumb: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg',
        idAutos: []
      },
      {
        id: 'respaldo-quinua',
        label: 'Historico',
        title: 'Pampa de Quinua',
        desc: 'Visita historica a Quinua y la Pampa de Ayacucho. Half day desde S/. 65 por persona.',
        name: 'Desde S/. 65',
        bg: 'https://www.ytuqueplanes.com/imagenes/fotos/novedades/sierra-pampa-quinua.JPG',
        thumb: 'https://www.ytuqueplanes.com/imagenes/fotos/novedades/sierra-pampa-quinua.JPG',
        idAutos: []
      },
      {
        id: 'respaldo-vilcashuaman',
        label: 'Full Day',
        title: 'Vilcashuaman',
        desc: 'Ruta arqueologica al templo del Sol y la Luna. Full day desde S/. 90 por persona.',
        name: 'Desde S/. 90',
        bg: 'https://images.pexels.com/photos/2929906/pexels-photo-2929906.jpeg',
        thumb: 'https://images.pexels.com/photos/2929906/pexels-photo-2929906.jpeg',
        idAutos: []
      }
    ];
  }
}
