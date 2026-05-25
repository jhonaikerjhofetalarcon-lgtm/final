import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsientoDto, AutoDto, DestinoDto, G7ApiService, PagoDto, ReservaDto } from '../../core/g7-api.service';

interface PagoReservaForm {
  monto: number | null;
  metodo: string;
  estado: string;
  referencia: string;
  fechaPago: string;
}

interface AdminReservaForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  dni: number | null;
  idAuto: string;
  idAsiento: string;
  notas: string;
  monto: number | null;
  metodo: string;
  referencia: string;
}

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

  busqueda = '';
  reservas: ReservaDto[] = [];
  pagos: PagoDto[] = [];
  destinos: DestinoDto[] = [];
  asientos: AsientoDto[] = [];
  autos: AutoDto[] = [];
  procesandoPagoId: string | null = null;
  pagoFormReservaId: string | null = null;
  pagoForm: PagoReservaForm = this.nuevoPagoForm();
  formVisible = false;
  guardandoReserva = false;
  reservaForm: AdminReservaForm = this.nuevaReservaForm();

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.getReservas().subscribe({
      next: (data) => this.reservas = data,
      error: () => console.error('Error cargando reservas')
    });

    this.api.getPagos().subscribe({
      next: (data) => this.pagos = data || [],
      error: () => console.error('Error cargando pagos')
    });

    this.api.getDestinos().subscribe({
      next: (data) => this.destinos = data || [],
      error: () => console.error('Error cargando destinos')
    });

    this.api.getAsientos().subscribe({
      next: (data) => this.asientos = data || [],
      error: () => console.error('Error cargando asientos')
    });

    this.api.getAutos().subscribe({
      next: (data) => this.autos = data || [],
      error: () => console.error('Error cargando autos')
    });
  }

  abrirFormularioReserva(): void {
    this.formVisible = true;
    this.reservaForm = this.nuevaReservaForm();
  }

  cerrarFormularioReserva(): void {
    this.formVisible = false;
    this.reservaForm = this.nuevaReservaForm();
  }

  eliminar(r: ReservaDto): void {
    if (!confirm(`¿Eliminar reserva de ${r.nombre} ${r.apellido}?`)) return;

    this.api.deleteReserva(r.id).subscribe({
      next: () => {
        this.cargar();
      },
      error: () => alert('No se pudo eliminar la reserva')
    });
  }

  filtrados(): ReservaDto[] {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) return this.reservas;

    return this.reservas.filter(r =>
      `${r.nombre} ${r.apellido}`.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.dni?.toString().includes(q) ||
      r.destino?.toLowerCase().includes(q)
    );
  }

  pagoDeReserva(reservaId: string): PagoDto | undefined {
    return this.pagos.find(p => p.reservaId === reservaId);
  }

  reservaPagada(reservaId: string): boolean {
    return this.pagoDeReserva(reservaId)?.estado === 'completado';
  }

  confirmarPagoReserva(r: ReservaDto): void {
    const pagoExistente = this.pagoDeReserva(r.id);

    if (pagoExistente) {
      this.procesandoPagoId = r.id;
      this.api.confirmarPago(pagoExistente.id).subscribe({
        next: () => this.cargar(),
        error: () => alert('No se pudo confirmar el pago'),
        complete: () => this.procesandoPagoId = null
      });
      return;
    }

    this.abrirFormularioPago(r);
  }

  abrirFormularioPago(r: ReservaDto): void {
    this.pagoFormReservaId = r.id;
    this.pagoForm = this.nuevoPagoForm();
  }

  cancelarFormularioPago(): void {
    this.pagoFormReservaId = null;
    this.pagoForm = this.nuevoPagoForm();
  }

  guardarPagoReserva(r: ReservaDto): void {
    const monto = Number(this.pagoForm.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      alert('Ingresa un monto mayor a 0');
      return;
    }

    if (!this.pagoForm.metodo.trim()) {
      alert('Selecciona un metodo de pago');
      return;
    }

    if (!this.pagoForm.referencia.trim()) {
      alert('Ingresa una referencia, operacion o codigo del pago');
      return;
    }

    this.procesandoPagoId = r.id;

    this.api.createPago({
      reservaId: r.id,
      monto,
      metodo: this.pagoForm.metodo,
      referencia: this.pagoForm.referencia.trim(),
      comprobanteUrl: ''
    }).subscribe({
      next: (pago) => {
        this.api.confirmarPago(pago.id).subscribe({
          next: () => {
            this.cancelarFormularioPago();
            this.cargar();
          },
          error: () => alert('El pago se creo, pero no se pudo confirmar'),
          complete: () => this.procesandoPagoId = null
        });
      },
      error: () => {
        alert('No se pudo registrar el pago');
        this.procesandoPagoId = null;
      }
    });
  }

  codigoReserva(r: ReservaDto): string {
    return `RES-${r.id.slice(0, 8).toUpperCase()}`;
  }

  asientoNumeroReserva(r: ReservaDto): string {
    const asiento = this.asientos.find(a => a.id === r.idAsiento);
    if (asiento?.numeroAsiento) return asiento.numeroAsiento;

    const match = (r.notas || '').match(/Asiento\s+([A-Za-z0-9-]+)/i);
    return match ? match[1] : '-';
  }

  onDestinoReservaChange(): void {
    const destino = this.destinoSeleccionadoAdmin();
    this.reservaForm.idAuto = destino?.idAuto || '';
    this.reservaForm.idAsiento = '';
  }

  onAutoReservaChange(): void {
    this.reservaForm.idAsiento = '';
  }

  destinoSeleccionadoAdmin(): DestinoDto | undefined {
    return this.destinos.find(d => d.title === this.reservaForm.destino);
  }

  autoSeleccionadoAdmin(): AutoDto | undefined {
    const asiento = this.asientos.find(a => a.id === this.reservaForm.idAsiento);
    const idAuto = this.reservaForm.idAuto || asiento?.idAuto;
    return this.autos.find(a => a.id === idAuto);
  }

  asientosDisponibles(): AsientoDto[] {
    return this.asientosCompletosAdmin().filter(a => this.asientoDisponibleParaFecha(a));
  }

  asientosCroquisAdmin(): AsientoSlot[][] {
    const idAuto = this.reservaForm.idAuto;
    if (!idAuto) return [];
    const restantes = this.asientosCompletosAdmin().filter(a => a.id !== this.copilotoAdmin()?.id);
    return this.crearCroquisAdmin(restantes, this.autoSeleccionadoAdmin());
  }

  copilotoAdmin(): AsientoDto | null {
    return this.asientosCompletosAdmin().find(a =>
      a.numeroAsiento?.toUpperCase().includes('C') ||
      a.numeroAsiento === '1' ||
      a.numeroAsiento === '01'
    ) || null;
  }

  asientoSeleccionadoAdmin(): AsientoDto | undefined {
    return this.asientosCompletosAdmin().find(a => a.id === this.reservaForm.idAsiento);
  }

  seleccionarAsientoAdmin(asiento: AsientoDto | null): void {
    if (!asiento) return;
    if (!this.asientoDisponibleParaFecha(asiento)) return;
    this.reservaForm.idAsiento = asiento.id;
  }

  asientoDisponibleParaFecha(asiento: AsientoDto): boolean {
    if (asiento.estado === 'ocupado') return false;
    const reservasDelAsiento = this.reservas.filter(r => this.reservaUsaAsiento(r, asiento));
    if (!reservasDelAsiento.length) return true;

    const ida = this.reservaForm.fechaIda;
    const vuelta = this.reservaForm.fechaVuelta || ida;
    return reservasDelAsiento.every(r => r.fechaVuelta < ida || r.fechaIda > vuelta);
  }

  nombreAuto(idAuto: string): string {
    const auto = this.autos.find(a => a.id === idAuto);
    return auto ? `${auto.placa} - ${auto.marca} ${auto.modelo}` : idAuto;
  }

  private numeroOrdenAsiento(asiento: AsientoDto): number {
    const n = Number(String(asiento.numeroAsiento || '').replace(/\D/g, ''));
    return Number.isFinite(n) && n > 0 ? n : 999;
  }

  private asientosCompletosAdmin(): AsientoDto[] {
    const auto = this.autoSeleccionadoAdmin();
    if (!auto) return [];

    const asientosAuto = this.asientos.filter(a => a.idAuto === auto.id);
    const total = Number(auto.cantidadAsiento) || asientosAuto.length || 0;
    const porNumero = new Map(asientosAuto.map(a => [this.normalizarNumero(a.numeroAsiento), a]));
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

    return completos.sort((a, b) => this.numeroOrdenAsiento(a) - this.numeroOrdenAsiento(b));
  }

  private crearCroquisAdmin(asientos: AsientoDto[], auto?: AutoDto): AsientoSlot[][] {
    const tipo = `${auto?.tipo || ''} ${auto?.marca || ''} ${auto?.modelo || ''}`.toLowerCase();
    const esMinivan = tipo.includes('minivan') || tipo.includes('master') || tipo.includes('hiace') || tipo.includes('combi');
    const ordenados = [...asientos].sort((a, b) => this.numeroOrdenAsiento(a) - this.numeroOrdenAsiento(b));

    if (esMinivan && ordenados.length <= 14) {
      const mapa = new Map(ordenados.map(a => [this.normalizarNumero(a.numeroAsiento), a]));
      const asiento = (numero: number): AsientoDto | null => mapa.get(String(numero)) ?? null;
      return [
        [asiento(2), asiento(3), null, asiento(4)],
        [asiento(5), asiento(6), null, asiento(7)],
        [asiento(8), asiento(9), null, asiento(10)],
        [asiento(11), asiento(12), null, asiento(13)],
        [asiento(14), null, null, asiento(15)],
      ].filter(fila => fila.some(Boolean));
    }

    const filas: AsientoSlot[][] = [];
    for (let i = 0; i < ordenados.length; i += 4) {
      filas.push(ordenados.slice(i, i + 4));
    }
    return filas;
  }

  private reservaUsaAsiento(reserva: ReservaDto, asiento: AsientoDto): boolean {
    if (reserva.idAsiento === asiento.id) return true;
    const asientoReserva = this.asientos.find(a => a.id === reserva.idAsiento);
    if (!asientoReserva) return false;
    return asientoReserva.idAuto === asiento.idAuto &&
      this.normalizarNumero(asientoReserva.numeroAsiento) === this.normalizarNumero(asiento.numeroAsiento);
  }

  private normalizarNumero(numero: string): string {
    return String(numero || '').replace(/\D/g, '') || String(numero || '').trim().toUpperCase();
  }

  guardarReservaConPago(): void {
    const f = this.reservaForm;
    const monto = Number(f.monto);

    if (!f.nombre.trim() || !f.apellido.trim() || !f.email.trim() || !f.telefono.trim()) {
      alert('Completa los datos del cliente');
      return;
    }

    if (!f.destino.trim() || !f.fechaIda || !f.fechaVuelta || !f.idAuto || !f.idAsiento) {
      alert('Completa destino, fechas, vehiculo y asiento');
      return;
    }

    if (new Date(f.fechaVuelta) < new Date(f.fechaIda)) {
      alert('La fecha de vuelta no puede ser anterior a la fecha de ida');
      return;
    }

    if (!Number.isFinite(monto) || monto <= 0 || !f.metodo.trim() || !f.referencia.trim()) {
      alert('Completa monto, metodo y referencia del pago');
      return;
    }

    const asientoSeleccionado = this.asientoSeleccionadoAdmin();
    if (!asientoSeleccionado) {
      alert('Selecciona un asiento en el croquis');
      return;
    }

    this.guardandoReserva = true;

    const guardarReserva = (idAsiento: string) => this.api.createReserva({
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      email: f.email.trim(),
      telefono: f.telefono.trim(),
      destino: f.destino.trim(),
      fechaIda: f.fechaIda,
      fechaVuelta: f.fechaVuelta,
      dni: Number(f.dni) || 0,
      idAsiento,
      notas: f.notas.trim() || `Reserva admin - ${f.destino} - Asiento ${asientoSeleccionado.numeroAsiento}`
    });

    const crearAsientoSiHaceFalta = asientoSeleccionado.id.startsWith('virtual-')
      ? this.api.createAsiento({
          idAuto: asientoSeleccionado.idAuto,
          numeroAsiento: asientoSeleccionado.numeroAsiento,
          estado: 'libre'
        })
      : null;

    const flujoReserva = (idAsiento: string) => guardarReserva(idAsiento).subscribe({
      next: (reserva) => {
        this.api.reservarAsiento(idAsiento, reserva.id).subscribe({
          next: () => this.crearYConfirmarPagoAdmin(reserva),
          error: () => {
            alert('La reserva se creo, pero no se pudo reservar el asiento');
            this.guardandoReserva = false;
            this.cargar();
          }
        });
      },
      error: () => {
        alert('No se pudo crear la reserva');
        this.guardandoReserva = false;
      }
    });

    if (crearAsientoSiHaceFalta) {
      crearAsientoSiHaceFalta.subscribe({
        next: (asientoCreado) => flujoReserva(asientoCreado.id),
        error: () => {
          alert('No se pudo crear el asiento seleccionado');
          this.guardandoReserva = false;
        }
      });
    } else {
      flujoReserva(asientoSeleccionado.id);
    }
  }

  private crearYConfirmarPagoAdmin(reserva: ReservaDto): void {
    this.api.createPago({
      reservaId: reserva.id,
      monto: Number(this.reservaForm.monto),
      metodo: this.reservaForm.metodo,
      referencia: this.reservaForm.referencia.trim(),
      comprobanteUrl: ''
    }).subscribe({
      next: (pago) => {
        this.api.confirmarPago(pago.id).subscribe({
          next: () => {
            this.cerrarFormularioReserva();
            this.cargar();
          },
          error: () => alert('La reserva y el pago se crearon, pero no se pudo confirmar el pago'),
          complete: () => this.guardandoReserva = false
        });
      },
      error: () => {
        alert('La reserva se creo, pero no se pudo registrar el pago');
        this.guardandoReserva = false;
        this.cargar();
      }
    });
  }

  private nuevoPagoForm(): PagoReservaForm {
    return {
      monto: null,
      metodo: 'yape',
      estado: 'completado',
      referencia: '',
      fechaPago: new Date().toISOString().slice(0, 16)
    };
  }

  private nuevaReservaForm(): AdminReservaForm {
    const hoy = new Date().toISOString().slice(0, 10);
    return {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      destino: '',
      fechaIda: hoy,
      fechaVuelta: hoy,
      dni: null,
      idAuto: '',
      idAsiento: '',
      notas: '',
      monto: null,
      metodo: 'yape',
      referencia: ''
    };
  }
}
