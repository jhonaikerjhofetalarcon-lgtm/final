import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, OfertaCreatePayload, OfertaDto, PaqueteDto } from '../../core/g7-api.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

interface OfertaForm {
  titulo: string;
  descripcion: string;
  descuento: number;
  fechaInicio: string;
  fechaFin: string;
  paqueteId: string;
}

interface OfertaDecorada extends OfertaDto {
  paquete?: PaqueteDto;
}

@Component({
  selector: 'app-ofertas',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './ofertas.html',
  styleUrl: './ofertas.css'
})
export class Ofertas implements OnInit {
  private readonly api = inject(G7ApiService);

  ofertas = signal<OfertaDto[]>([]);
  paquetes = signal<PaqueteDto[]>([]);
  formVisible = signal(false);
  editingId = signal<string | null>(null);
  error = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  form: OfertaForm = this.emptyForm();

  ofertasDecoradas = computed<OfertaDecorada[]>(() => {
    return this.ofertas().map(oferta => ({
      ...oferta,
      paquete: this.paquetes().find(p => p.id === oferta.paqueteId)
    }));
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.api.getOfertas().subscribe({
      next: data => this.ofertas.set(data || []),
      error: () => this.error.set('No se pudieron cargar las ofertas.')
    });
    this.api.getPaquetes().subscribe({
      next: data => this.paquetes.set(data || []),
      error: () => this.error.set('No se pudieron cargar los paquetes.')
    });
  }

  abrirNueva(): void {
    this.form = this.emptyForm();
    this.editingId.set(null);
    this.formVisible.set(true);
    this.error.set(null);
  }

  abrirEditar(oferta: OfertaDto): void {
    this.form = {
      titulo: oferta.titulo,
      descripcion: oferta.descripcion,
      descuento: Number(oferta.descuento) || 0,
      fechaInicio: oferta.fechaInicio,
      fechaFin: oferta.fechaFin,
      paqueteId: oferta.paqueteId
    };
    this.editingId.set(oferta.id);
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

    if (!payload.titulo || !payload.paqueteId || payload.descuento <= 0 || payload.descuento > 100) {
      this.error.set('Completa titulo, paquete y un descuento entre 1 y 100.');
      return;
    }

    const editando = Boolean(this.editingId());
    const request = editando
      ? this.api.updateOferta(this.editingId()!, payload)
      : this.api.createOferta(payload);

    request.subscribe({
      next: () => {
        this.cerrarFormulario();
        this.cargarDatos();
        this.flash(editando ? 'Oferta actualizada.' : 'Oferta creada.');
      },
      error: () => this.error.set('No se pudo guardar la oferta.')
    });
  }

  toggleEstado(oferta: OfertaDto): void {
    this.api.toggleOferta(oferta.id).subscribe({
      next: () => this.cargarDatos(),
      error: () => this.error.set('No se pudo cambiar el estado de la oferta.')
    });
  }

  eliminarOferta(oferta: OfertaDto): void {
    if (!confirm(`Eliminar la oferta "${oferta.titulo}"?`)) return;

    this.api.deleteOferta(oferta.id).subscribe({
      next: () => {
        this.cargarDatos();
        this.flash('Oferta eliminada.');
      },
      error: () => this.error.set('No se pudo eliminar la oferta.')
    });
  }

  private normalizarForm(): OfertaCreatePayload {
    return {
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion?.trim() || '',
      descuento: Number(this.form.descuento) || 0,
      fechaInicio: this.form.fechaInicio || '',
      fechaFin: this.form.fechaFin || '',
      paqueteId: this.form.paqueteId
    };
  }

  private emptyForm(): OfertaForm {
    return {
      titulo: '',
      descripcion: '',
      descuento: 10,
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaFin: '',
      paqueteId: ''
    };
  }

  private flash(message: string): void {
    this.successMsg.set(message);
    setTimeout(() => this.successMsg.set(null), 2500);
  }
}
