import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { G7ApiService, AsientoDto, ReservaCreatePayload, DestinoDto, AutoDto, PaqueteDto } from '../../core/g7-api.service';

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
      next: (paquete) => {
        this.paqueteSeleccionado = paquete;
        this.preseleccionarDestino();
      },
      error: () => this.errorApi = 'No se pudo cargar el paquete seleccionado'
    });
  }

  private preseleccionarDestino() {
    if (!this.destinos.length) return;

    const destinoId = this.route.snapshot.queryParamMap.get('destinoId');
    const localDestino = this.obtenerDestinoLocal();
    const paqueteTexto = `${this.paqueteSeleccionado?.titulo || ''} ${this.paqueteSeleccionado?.descripcion || ''}`.toLowerCase();

    const destino =
      this.destinos.find(d => d.id === destinoId) ||
      (localDestino ? this.destinos.find(d => d.id === localDestino.id) : null) ||
      (paqueteTexto ? this.destinos.find(d =>
        paqueteTexto.includes((d.title || '').toLowerCase()) ||
        paqueteTexto.includes((d.name || '').toLowerCase())
      ) : null);

    if (!destino || this.destinoSeleccionado?.id === destino.id) return;

    this.destinoSeleccionado = destino;
    this.onDestinoChange();
  }

  private obtenerDestinoLocal(): DestinoDto | null {
    const raw = localStorage.getItem('destinoSeleccionado');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DestinoDto;
    } catch {
      return null;
    }
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
      const asientosBackend = todosAsientos.filter(a => a.idAuto === this.destinoSeleccionado!.idAuto);
      this.asientos = this.completarAsientosVehiculo(asientosBackend, this.autoSeleccionado);

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
      this.asientosCroquis = this.crearCroquis(restantes, this.autoSeleccionado);

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
    this.asientosCroquis = [];
    this.copiloto = null;
    this.asientosSeleccionados = [];
  }

  private completarAsientosVehiculo(asientosBackend: AsientoDto[], auto: AutoDto | null): AsientoDto[] {
    if (!auto) return this.ordenarAsientos(asientosBackend);

    const total = Number(auto.cantidadAsiento) || asientosBackend.length || 0;
    const porNumero = new Map(asientosBackend.map(a => [this.normalizarNumero(a.numeroAsiento), a]));
    const completos: AsientoDto[] = [];

    for (let i = 1; i <= total; i++) {
      const numero = String(i);
      completos.push(porNumero.get(numero) ?? {
        id: `virtual-${auto.id}-${numero}`,
        idAuto: auto.id,
        numeroAsiento: numero,
        estado: 'libre',
        idReserva: null
      });
    }

    return completos;
  }

  private crearCroquis(asientos: AsientoDto[], auto: AutoDto | null): AsientoSlot[][] {
    const tipo = `${auto?.tipo || ''} ${auto?.marca || ''} ${auto?.modelo || ''}`.toLowerCase();
    const esMinivan = tipo.includes('minivan') || tipo.includes('master') || tipo.includes('hiace') || tipo.includes('combi');
    const ordenados = this.ordenarAsientos(asientos);

    if (esMinivan && ordenados.length <= 14) {
      return this.crearCroquisMinivan15(ordenados);
    }

    const filas: AsientoSlot[][] = [];
    for (let i = 0; i < ordenados.length; i += 4) {
      filas.push(ordenados.slice(i, i + 4));
    }
    return filas;
  }

  private crearCroquisMinivan15(asientos: AsientoDto[]): AsientoSlot[][] {
    const mapa = new Map(asientos.map(a => [this.normalizarNumero(a.numeroAsiento), a]));
    const asiento = (numero: number): AsientoDto | null => mapa.get(String(numero)) ?? null;

    return [
      [asiento(2), asiento(3), null, asiento(4)],
      [asiento(5), asiento(6), null, asiento(7)],
      [asiento(8), asiento(9), null, asiento(10)],
      [asiento(11), asiento(12), null, asiento(13)],
      [asiento(14), null, null, asiento(15)],
    ].filter(fila => fila.some(Boolean));
  }

  private ordenarAsientos(asientos: AsientoDto[]): AsientoDto[] {
    return [...asientos].sort((a, b) => {
      const na = Number(this.normalizarNumero(a.numeroAsiento));
      const nb = Number(this.normalizarNumero(b.numeroAsiento));
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.numeroAsiento.localeCompare(b.numeroAsiento);
    });
  }

  private normalizarNumero(numero: string): string {
    return String(numero || '').replace(/\D/g, '') || String(numero || '').trim().toUpperCase();
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
          destino: this.paqueteSeleccionado?.titulo || this.destinoSeleccionado.name || this.destinoSeleccionado.title,
          fechaIda: '2026-06-15',
          fechaVuelta: '2026-06-20',
          dni: p.dni,
          clase: 'economica',
          notas: this.paqueteSeleccionado
            ? `Paquete ${this.paqueteSeleccionado.titulo} - Destino ${this.destinoSeleccionado.title} - Asiento ${asiento.numeroAsiento}`
            : `Asiento ${asiento.numeroAsiento} - ${this.destinoSeleccionado.title}`,
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
    this.paqueteSeleccionado = null;
    this.autoSeleccionado = null;
  }
}
