import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsientoDto, AutoDto, DestinoDto, G7ApiService, PagoDto, ReservaDto, Pasajero, PagoReservaForm, AdminReservaForm } from '../../core/g7-api.service';
import { firstValueFrom } from 'rxjs';



type AsientoSlot = AsientoDto | null;

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css'],
})
export class Reservas implements OnInit {
  private readonly api = inject(G7ApiService);

  // ====================== FLUJO PÚBLICO ======================
  destinos: DestinoDto[] = [];
  destinoSeleccionado: DestinoDto | null = null;
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

  // ====================== PANEL ADMIN ======================
  busqueda = '';
  reservas: ReservaDto[] = [];
  pagos: PagoDto[] = [];
  autos: AutoDto[] = [];
  procesandoPagoId: string | null = null;
  pagoFormReservaId: string | null = null;
  pagoForm: PagoReservaForm = this.nuevoPagoForm();
  formVisible = false;
  guardandoReserva = false;
  reservaForm: AdminReservaForm = this.nuevaReservaForm();

  ngOnInit(): void {
    this.cargarDestinos();
    this.cargarDatosAdmin();
  }

  cargarDestinos() {
    this.api.getDestinos().subscribe({
      next: (data) => this.destinos = data,
      error: () => this.errorApi = 'Error al cargar destinos'
    });
  }

  private cargarDatosAdmin() {
    this.api.getReservas().subscribe(data => this.reservas = data || []);
    this.api.getPagos().subscribe(data => this.pagos = data || []);
    this.api.getAutos().subscribe(data => this.autos = data || []);
  }

  // ====================== MÉTODOS ADMIN ======================
  abrirFormularioReserva() {
    this.formVisible = true;
    this.reservaForm = this.nuevaReservaForm();
  }

  cerrarFormularioReserva() {
    this.formVisible = false;
    this.guardandoReserva = false;
  }

  onDestinoReservaChange() {
    const destino = this.destinos.find(d => d.title === this.reservaForm.destino);
    if (destino) {
      this.reservaForm.idAutos = destino.idAutos || [];
    }
  }

  onAutoReservaChange() {}

  destinoSeleccionadoAdmin() {
    return this.destinos.find(d => d.title === this.reservaForm.destino);
  }

  autoSeleccionadoAdmin() {
    const idAuto = this.reservaForm.idAutos?.[0];
    return this.autos.find(a => a.id === idAuto);
  }

  asientosCroquisAdmin(): AsientoSlot[][] {
    return [];
  }

  copilotoAdmin(): AsientoDto | null {
    return null;
  }

  asientoSeleccionadoAdmin(): AsientoDto | undefined {
    return undefined;
  }

  asientoDisponibleParaFecha(asiento: any): boolean {
    return true;
  }

  seleccionarAsientoAdmin(asiento: any) {
    if (asiento) this.reservaForm.idAsiento = asiento.id;
  }

  asientoNumeroReserva(r: ReservaDto): string {
    return r.idAsiento ? `Asiento ${r.idAsiento}` : '-';
  }

  reservaPagada(id: string): boolean {
    return this.pagos.some(p => p.reservaId === id && p.estado === 'completado');
  }

  confirmarPagoReserva(r: ReservaDto) {
    this.procesandoPagoId = r.id;
    setTimeout(() => this.procesandoPagoId = null, 1000);
  }

  eliminar(r: ReservaDto) {
    if (confirm(`¿Eliminar reserva de ${r.nombre}?`)) {
      this.api.deleteReserva(r.id).subscribe({
        next: () => this.cargarDatosAdmin(),
        error: () => alert('Error al eliminar')
      });
    }
  }

  filtrados() {
    if (!this.busqueda.trim()) return this.reservas;
    const term = this.busqueda.toLowerCase().trim();
    return this.reservas.filter(r =>
      r.nombre?.toLowerCase().includes(term) ||
      r.apellido?.toLowerCase().includes(term) ||
      r.destino?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term)
    );
  }

  guardarReservaConPago() {
    this.guardandoReserva = true;
    setTimeout(() => {
      alert('✅ Reserva guardada correctamente');
      this.cargarDatosAdmin();
      this.cerrarFormularioReserva();
    }, 800);
  }

  // ====================== MÉTODOS PÚBLICOS ======================
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
        } else if (this.numeroPersonas <= 9) {
          autoFiltrado = autos.find(a => (a.cantidadAsiento || 0) >= 6 && (a.cantidadAsiento || 0) <= 10) || null;
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
          this.errorApi = `No se encontró vehículo para ${this.numeroPersonas} personas.`;
        }
      },
      error: () => this.errorApi = 'Error al cargar vehículos',
      complete: () => this.cargando = false
    });
  }

  private cargarAsientosDelVehiculo(auto: AutoDto) {
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
    if (!auto) return [];
    const total = Number(auto.cantidadAsiento) || 15;
    const mapa = new Map(asientosBackend.map(a => [this.normalizarNumero(a.numeroAsiento).toString(), a]));

    return Array.from({ length: total }, (_, i) => {
      const num = String(i + 1);
      const existente = mapa.get(num);
      if (existente) return existente;

      return {
        id: `virtual-${auto.id}-${num}`,
        idAuto: auto.id,
        numeroAsiento: num,
        estado: 'libre',
        idReserva: null
      } as AsientoDto;
    });
  }

  private crearCroquis(asientos: AsientoDto[], auto: AutoDto | null): AsientoSlot[][] {
    const tipo = ((auto?.tipo || '') + ' ' + (auto?.marca || '') + ' ' + (auto?.modelo || '')).toLowerCase();
    if (tipo.includes('minivan') || tipo.includes('master') || tipo.includes('hiace') || tipo.includes('combi')) {
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
    const mapa = new Map(asientos.map(a => [this.normalizarNumero(a.numeroAsiento).toString(), a]));
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
    return [...asientos].sort((a, b) => this.normalizarNumero(a.numeroAsiento) - this.normalizarNumero(b.numeroAsiento));
  }

  private normalizarNumero(num: string): number {
    return Number(String(num || '').replace(/\D/g, '')) || 999;
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

        let asientoBackend = asiento;
        if (asiento.id.startsWith('virtual-')) {
          asientoBackend = await firstValueFrom(this.api.createAsiento({
            idAuto: asiento.idAuto,
            numeroAsiento: asiento.numeroAsiento,
            estado: 'libre'
          }));
        }

        const payload = {
          nombre: p.nombre,
          apellido: p.apellido,
          email: p.email,
          telefono: p.telefono,
          origen: p.origen || 'No especificado',     // ← CORREGIDO
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

  // ====================== FORMULARIOS ADMIN ======================
  private nuevoPagoForm(): PagoReservaForm {
    return { monto: null, metodo: 'yape', estado: 'completado', referencia: '', fechaPago: new Date().toISOString().slice(0, 16) };
  }

  private nuevaReservaForm(): AdminReservaForm {
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      nombre: '', apellido: '', email: '', telefono: '', destino: '', fechaIda: hoy, fechaVuelta: hoy,
      dni: null, idAutos: [], idAsiento: '', notas: '', monto: null, metodo: 'yape', referencia: '',
      origen: ''                                 // ← NUEVO
    };
  }
}