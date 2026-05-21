import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, OfertaDto, PaqueteCreatePayload, PaqueteDto } from '../../core/g7-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

interface PaqueteForm {
  titulo: string;
  descripcion: string;
  presio: number;
  id_paquete: string;
  imagenes: string;
  estado: boolean;
}

interface PaqueteConOferta extends PaqueteDto {
  oferta?: OfertaDto;
  precioFinal: number;
}

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './paquetes.html',
  styleUrl: './paquetes.css'
})
export class Paquetes implements OnInit {
  private readonly api = inject(G7ApiService);

  paquetesRaw = signal<PaqueteDto[]>([]);
  ofertasRaw = signal<OfertaDto[]>([]);
  formVisible = signal(false);
  editingId = signal<string | null>(null);
  error = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  form: PaqueteForm = this.emptyForm();

  listaPaquetes = computed<PaqueteConOferta[]>(() => {
    return this.paquetesRaw().map(p => {
      const oferta = this.ofertasRaw().find(o => o.paqueteId === p.id && o.estado);
      const precioBase = Number(p.presio) || 0;
      const precioFinal = oferta ? precioBase - (precioBase * (oferta.descuento / 100)) : precioBase;
      return { ...p, oferta, precioFinal };
    });
  });

  totalValor = computed(() => this.listaPaquetes().reduce((total, p) => total + (Number(p.precioFinal) || 0), 0));

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.api.getPaquetes().subscribe({
      next: data => this.paquetesRaw.set(data || []),
      error: () => this.error.set('No se pudieron cargar los paquetes.')
    });
    this.api.getOfertasActivas().subscribe({
      next: data => this.ofertasRaw.set(data || []),
      error: () => this.error.set('No se pudieron cargar las ofertas activas.')
    });
  }

  abrirNuevo(): void {
    this.form = this.emptyForm();
    this.editingId.set(null);
    this.formVisible.set(true);
    this.error.set(null);
  }

  abrirEditar(paquete: PaqueteDto): void {
    this.form = {
      titulo: paquete.titulo,
      descripcion: paquete.descripcion,
      presio: Number(paquete.presio) || 0,
      id_paquete: paquete.id_paquete,
      imagenes: paquete.imagenes,
      estado: paquete.estado
    };
    this.editingId.set(paquete.id);
    this.formVisible.set(true);
    this.error.set(null);
  }

  cerrarFormulario(): void {
    this.formVisible.set(false);
    this.editingId.set(null);
    this.error.set(null);
  }

  guardar(): void {
    const payload = this.normalizarForm();

    if (!payload.titulo || payload.presio <= 0) {
      this.error.set('Ingresa un titulo y un precio mayor a 0.');
      return;
    }

    const editando = Boolean(this.editingId());
    const request = editando
      ? this.api.updatePaquete(this.editingId()!, payload)
      : this.api.createPaquete(payload);

    request.subscribe({
      next: () => {
        this.cerrarFormulario();
        this.cargarDatos();
        this.flash(editando ? 'Paquete actualizado.' : 'Paquete creado.');
      },
      error: () => this.error.set('No se pudo guardar el paquete.')
    });
  }

  toggleEstado(paquete: PaqueteDto): void {
    this.api.togglePaquete(paquete.id).subscribe({
      next: () => this.cargarDatos(),
      error: () => this.error.set('No se pudo cambiar el estado del paquete.')
    });
  }

  eliminar(paquete: PaqueteDto): void {
    if (!confirm(`Eliminar el paquete "${paquete.titulo}"?`)) return;

    this.api.deletePaquete(paquete.id).subscribe({
      next: () => {
        this.cargarDatos();
        this.flash('Paquete eliminado.');
      },
      error: () => this.error.set('No se pudo eliminar el paquete.')
    });
  }

  private normalizarForm(): PaqueteCreatePayload {
    return {
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion?.trim() || '',
      presio: Number(this.form.presio) || 0,
      id_paquete: this.form.id_paquete?.trim() || '',
      imagenes: this.form.imagenes?.trim() || '',
      estado: Boolean(this.form.estado)
    };
  }

  private emptyForm(): PaqueteForm {
    return {
      titulo: '',
      descripcion: '',
      presio: 0,
      id_paquete: '',
      imagenes: '',
      estado: true
    };
  }

  private flash(message: string): void {
    this.successMsg.set(message);
    setTimeout(() => this.successMsg.set(null), 2500);
  }
}
