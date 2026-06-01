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
  asientosFormulario: AsientoDto[] = [];
  asientosCroquisFormulario: AsientoSlot[][] = [];
  copilotoFormulario: AsientoDto | null = null;
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
    this.api.getAsientos().subscribe(data => this.asientos = data || []);
  }

  // ====================== MÉTODOS ADMIN ======================
  abrirFormularioReserva() {
    this.formVisible = true;
    this.reservaForm = this.nuevaReservaForm();
    this.asientosFormulario = [];
    this.asientosCroquisFormulario = [];
    this.copilotoFormulario = null;
  }

  cerrarFormularioReserva() {
    this.formVisible = false;
    this.guardandoReserva = false;
  }

  onDestinoReservaChange() {
    const destino = this.destinos.find(d => d.title === this.reservaForm.destino);
    if (destino) {
      this.reservaForm.idAutos = destino.idAutos || [];
      this.reservaForm.idAsiento = '';
      this.cargarAsientosFormulario();
    }
  }

  onAutoReservaChange() {
    this.reservaForm.idAsiento = '';
    this.cargarAsientosFormulario();
  }

  destinoSeleccionadoAdmin() {
    return this.destinos.find(d => d.title === this.reservaForm.destino);
  }

  autoSeleccionadoAdmin() {
    const idAuto = this.reservaForm.idAutos?.[0];
    return this.autos.find(a => a.id === idAuto);
  }

  asientosCroquisAdmin(): AsientoSlot[][] {
    return this.asientosCroquisFormulario;
  }

  copilotoAdmin(): AsientoDto | null {
    return this.copilotoFormulario;
  }

  asientoSeleccionadoAdmin(): AsientoDto | undefined {
    return this.asientosFormulario.find(a => a.id === this.reservaForm.idAsiento);
  }

  private asientoReservadoEnFecha(asiento: AsientoDto, fechaIda: string): boolean {
    if (!fechaIda) return false;
    const fechaSeleccionada = String(fechaIda).slice(0, 10);
    return this.reservas.some(r =>
      String(r.fechaIda || '').slice(0, 10) === fechaSeleccionada && r.idAsiento === asiento.id
    );
  }

  private marcarAsientosReservadosPorFecha(asientos: AsientoDto[], fechaIda: string): AsientoDto[] {
    return asientos.map(asiento => {
      if (this.asientoReservadoEnFecha(asiento, fechaIda)) {
        return { ...asiento, estado: 'reservado' };
      }
      return { ...asiento, estado: asiento.estado === 'ocupado' ? 'ocupado' : 'libre' };
    });
  }

  asientoDisponibleParaFecha(asiento: AsientoDto): boolean {
    if (asiento.id === this.reservaForm.idAsiento) return true;
    if (asiento.estado === 'ocupado') return false;
    return !this.asientoReservadoEnFecha(asiento, this.reservaForm.fechaIda || '');
  }

  onFechaAdminChange() {
    const auto = this.autoSeleccionadoAdmin();
    if (this.asientosFormulario.length && this.reservaForm.fechaIda) {
      this.asientosFormulario = this.marcarAsientosReservadosPorFecha(this.asientosFormulario, this.reservaForm.fechaIda);
      this.copilotoFormulario = this.asientosFormulario.find(a =>
        a.numeroAsiento?.toUpperCase().includes('C') || ['1', '01'].includes(a.numeroAsiento || '')
      ) || null;
      if (auto) {
        const restantes = this.asientosFormulario.filter(a => a.id !== this.copilotoFormulario?.id);
        this.asientosCroquisFormulario = this.crearCroquis(restantes, auto);
      }
    }

    if (this.reservaForm.idAsiento) {
      const asientoActual = this.asientosFormulario.find(a => a.id === this.reservaForm.idAsiento);
      if (asientoActual && !this.asientoDisponibleParaFecha(asientoActual)) {
        this.reservaForm.idAsiento = '';
      }
    }
  }

  seleccionarAsientoAdmin(asiento: AsientoDto) {
    if (!asiento || !this.asientoDisponibleParaFecha(asiento)) return;
    this.reservaForm.idAsiento = this.reservaForm.idAsiento === asiento.id ? '' : asiento.id;
  }

  asientoNumeroReserva(r: ReservaDto): string {
    if (!r.idAsiento) return '-';

    const asiento = this.asientos.find(a => a.id === r.idAsiento);
    if (asiento?.numeroAsiento) {
      return `Asiento ${asiento.numeroAsiento}`;
    }

    const nota = String(r.notas || '').match(/Asiento\s+([^\s-]+)/i);
    return nota ? `Asiento ${nota[1]}` : `Asiento ${r.idAsiento}`;
  }

  vehiculoReserva(r: ReservaDto): string {
    const asiento = this.asientos.find(a => a.id === r.idAsiento);
    const auto = asiento ? this.autos.find(a => a.id === asiento.idAuto) : null;

    if (auto) {
      return `${auto.placa} - ${auto.marca} ${auto.modelo}`;
    }

    const nota = String(r.notas || '');
    const vehiculoEnNota = nota.match(/Asiento\s+[^\s-]+\s+-\s+(.+)$/i);
    return vehiculoEnNota?.[1]?.trim() || '-';
  }

  reservaPagada(id: string): boolean {
    return this.pagos.some(p => p.reservaId === id && p.estado === 'completado');
  }

  abrirPagoReserva(r: ReservaDto) {
    this.errorApi = null;
    this.pagoFormReservaId = this.pagoFormReservaId === r.id ? null : r.id;
    this.pagoForm = this.nuevoPagoForm();
  }

  cancelarPagoReserva() {
    this.pagoFormReservaId = null;
    this.pagoForm = this.nuevoPagoForm();
    this.procesandoPagoId = null;
  }

  async guardarPagoReserva(r: ReservaDto) {
    const monto = Number(this.pagoForm.monto);
    if (!monto || monto <= 0 || !this.pagoForm.metodo) {
      this.errorApi = 'Completa el monto y metodo de pago.';
      return;
    }

    this.procesandoPagoId = r.id;
    this.errorApi = null;

    try {
      const pago = await firstValueFrom(this.api.createPago({
        reservaId: r.id,
        monto,
        metodo: this.pagoForm.metodo,
        referencia: this.pagoForm.referencia || '',
        comprobanteUrl: ''
      }));

      if (this.pagoForm.estado === 'completado') {
        await firstValueFrom(this.api.confirmarPago(pago.id));
      }

      this.cancelarPagoReserva();
      this.cargarDatosAdmin();
    } catch (error) {
      console.error(error);
      this.errorApi = 'No se pudo registrar el pago.';
    } finally {
      this.procesandoPagoId = null;
    }
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
    const auto = this.autoSeleccionadoAdmin();
    const asiento = this.asientoSeleccionadoAdmin();
    const monto = Number(this.reservaForm.monto);

    if (!this.reservaForm.nombre.trim() || !this.reservaForm.apellido.trim() || !this.reservaForm.email.trim() ||
        !this.reservaForm.telefono.trim() || !this.reservaForm.destino || !auto || !asiento) {
      this.errorApi = 'Completa cliente, destino, vehiculo y asiento.';
      return;
    }

    if (!monto || monto <= 0 || !this.reservaForm.metodo) {
      this.errorApi = 'Completa el monto y metodo de pago.';
      return;
    }

    this.guardandoReserva = true;
    this.errorApi = null;

    this.guardarReservaAdmin(auto, asiento, monto)
      .then(() => {
        alert('Reserva guardada correctamente');
        this.cargarDatosAdmin();
        this.cerrarFormularioReserva();
      })
      .catch((error) => {
        console.error(error);
        this.errorApi = 'No se pudo guardar la reserva.';
      })
      .finally(() => this.guardandoReserva = false);
    return;

    this.guardandoReserva = true;
    setTimeout(() => {
      alert('✅ Reserva guardada correctamente');
      this.cargarDatosAdmin();
      this.cerrarFormularioReserva();
    }, 800);
  }

  // ====================== MÉTODOS PÚBLICOS ======================
  private async guardarReservaAdmin(auto: AutoDto, asiento: AsientoDto, monto: number): Promise<void> {
    const asientoBackend = asiento.id.startsWith('virtual-')
      ? await firstValueFrom(this.api.createAsiento({
          idAuto: asiento.idAuto,
          numeroAsiento: asiento.numeroAsiento,
          estado: 'libre'
        }))
      : asiento;

    const reserva = await firstValueFrom(this.api.createReserva({
      nombre: this.reservaForm.nombre.trim(),
      apellido: this.reservaForm.apellido.trim(),
      email: this.reservaForm.email.trim(),
      telefono: this.reservaForm.telefono.trim(),
      origen: this.reservaForm.origen?.trim() || 'No especificado',
      destino: this.reservaForm.destino,
      fechaIda: this.reservaForm.fechaIda,
      fechaVuelta: this.reservaForm.fechaVuelta || this.reservaForm.fechaIda,
      dni: Number(this.reservaForm.dni) || 0,
      idAsiento: asientoBackend.id,
      notas: `Asiento ${asiento.numeroAsiento} - ${auto.placa} ${auto.marca} ${auto.modelo}`.trim()
    }));

    const pago = await firstValueFrom(this.api.createPago({
      reservaId: reserva.id,
      monto,
      metodo: this.reservaForm.metodo,
      referencia: this.reservaForm.referencia || '',
      comprobanteUrl: ''
    }));

    await firstValueFrom(this.api.reservarAsiento(asientoBackend.id, reserva.id));
    await firstValueFrom(this.api.confirmarPago(pago.id));
  }

  private cargarAsientosFormulario() {
    const auto = this.autoSeleccionadoAdmin();
    this.asientosFormulario = [];
    this.asientosCroquisFormulario = [];
    this.copilotoFormulario = null;

    if (!auto) return;

    this.api.getAsientos().subscribe({
      next: (todosAsientos) => {
        this.asientos = todosAsientos || [];
        const asientosBackend = this.asientos.filter(a => a.idAuto === auto.id);
        this.asientosFormulario = this.completarAsientosVehiculo(asientosBackend, auto);
        this.asientosFormulario = this.marcarAsientosReservadosPorFecha(this.asientosFormulario, this.reservaForm.fechaIda);

        this.copilotoFormulario = this.asientosFormulario.find(a =>
          a.numeroAsiento?.toUpperCase().includes('C') || ['1', '01'].includes(a.numeroAsiento || '')
        ) || null;

        const restantes = this.asientosFormulario.filter(a => a.id !== this.copilotoFormulario?.id);
        this.asientosCroquisFormulario = this.crearCroquis(restantes, auto);
      },
      error: () => this.errorApi = 'No se pudieron cargar los asientos del vehiculo.'
    });
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
    const idx = this.asientosSeleccionados.findIndex(a => a.id === asiento.id);
    if (idx >= 0) {
      this.asientosSeleccionados.splice(idx, 1);
      asiento.estado = 'libre';
      return;
    }

    if (asiento.estado !== 'libre') {
      return;
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
