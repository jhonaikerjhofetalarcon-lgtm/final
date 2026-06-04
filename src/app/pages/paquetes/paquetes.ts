import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AutoDto, G7ApiService, OfertaDto, PaqueteDto } from '../../core/g7-api.service';

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

  readonly hospedajePlatero = {
    nombre: 'PLATERO',
    descripcion: 'Hospedaje incluido para todos los paquetes.',
    imagenes: [
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
      'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg',
    ],
  };

  paquetes = signal<PaqueteDto[]>([]);
  ofertas = signal<OfertaDto[]>([]);
  autos = signal<AutoDto[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  paquetesPublicados = computed<PaquetePublicado[]>(() => {
    return this.paquetes()
      .filter(paquete => paquete.estado !== false)
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

    this.api.getAutos().subscribe({
      next: data => this.autos.set(data || []),
      error: () => this.autos.set([]),
    });
  }

  getAutoInfo(idAutos?: string[]): string {
    if (!idAutos || idAutos.length === 0) {
      return 'Sin vehiculo asignado';
    }

    return idAutos
      .map(id => {
        const auto = this.autos().find(a => this.autoCoincide(id, a));
        return auto ? `${auto.placa} - ${auto.marca} ${auto.modelo}` : 'Desconocido';
      })
      .join(', ');
  }

  private autoCoincide(id: string, auto: AutoDto): boolean {
    const valor = String(id || '').trim().toLowerCase();
    if (!valor) return false;

    const idAuto = String(auto.id || '').trim().toLowerCase();
    const placa = String(auto.placa || '').trim().toLowerCase();
    const modelo = `${auto.marca || ''} ${auto.modelo || ''}`.trim().toLowerCase();
    return idAuto === valor || placa === valor || modelo === valor;
  }
}
