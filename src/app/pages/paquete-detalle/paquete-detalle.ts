import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AutoDto, G7ApiService, OfertaDto, PaqueteDto } from '../../core/g7-api.service';

@Component({
  selector: 'app-paquete-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './paquete-detalle.html',
  styleUrl: './paquete-detalle.css',
})
export class PaqueteDetalle implements OnInit {
  private readonly api = inject(G7ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly hospedajePlatero = {
    nombre: 'PLATERO',
    descripcion: 'Hospedaje incluido en todos los paquetes de viaje.',
    ubicacion: 'Ayacucho',
    imagenes: [
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg',
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
      'https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg',
      'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg',
    ],
  };

  paquete = signal<PaqueteDto | null>(null);
  ofertas = signal<OfertaDto[]>([]);
  autos = signal<AutoDto[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  oferta = computed(() => {
    const paquete = this.paquete();
    if (!paquete) return undefined;
    return this.ofertas().find(o => o.estado && o.paqueteId === paquete.id);
  });

  precioFinal = computed(() => {
    const paquete = this.paquete();
    if (!paquete) return 0;
    const precioBase = Number(paquete.presio) || 0;
    const oferta = this.oferta();
    return oferta ? precioBase - (precioBase * (oferta.descuento / 100)) : precioBase;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Paquete no encontrado.');
      this.cargando.set(false);
      return;
    }

    this.api.getPaquete(id).subscribe({
      next: data => {
        this.paquete.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el paquete desde el backend.');
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
