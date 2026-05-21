import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { G7ApiService, OfertaDto, PaqueteDto } from '../../core/g7-api.service';

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

  paquete = signal<PaqueteDto | null>(null);
  ofertas = signal<OfertaDto[]>([]);
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
  }
}
