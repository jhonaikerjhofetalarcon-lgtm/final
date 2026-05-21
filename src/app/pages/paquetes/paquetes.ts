import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { G7ApiService, OfertaDto, PaqueteDto } from '../../core/g7-api.service';

interface PaquetePublicado extends PaqueteDto {
  oferta?: OfertaDto;
  precioFinal: number;
}

@Component({
  selector: 'app-paquetes-publicos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paquetes.html',
  styleUrl: './paquetes.css',
})
export class PaquetesPublicos implements OnInit {
  private readonly api = inject(G7ApiService);

  paquetes = signal<PaqueteDto[]>([]);
  ofertas = signal<OfertaDto[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  paquetesPublicados = computed<PaquetePublicado[]>(() => {
    return this.paquetes()
      .filter(paquete => paquete.estado)
      .map(paquete => {
        const oferta = this.ofertas().find(o => o.estado && o.paqueteId === paquete.id);
        const precioBase = Number(paquete.presio) || 0;
        const precioFinal = oferta
          ? precioBase - (precioBase * (oferta.descuento / 100))
          : precioBase;

        return { ...paquete, oferta, precioFinal };
      });
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.api.getPaquetes().subscribe({
      next: data => {
        this.paquetes.set(data || []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los paquetes desde el backend.');
        this.cargando.set(false);
      },
    });

    this.api.getOfertasActivas().subscribe({
      next: data => this.ofertas.set(data || []),
      error: () => this.ofertas.set([]),
    });
  }
}
