import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { G7ApiService, DestinoDto } from '../../core/g7-api.service';

@Component({
  selector: 'app-destino-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './destino-detalle.html',
  styleUrl: './destino-detalle.css',
})
export class DestinoDetalle implements OnInit {
  private readonly api = inject(G7ApiService);
  private readonly route = inject(ActivatedRoute);

  destino = signal<DestinoDto | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Destino no encontrado.');
      this.cargando.set(false);
      return;
    }

    this.api.getDestino(id).subscribe({
      next: data => {
        this.destino.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el destino desde el backend.');
        this.cargando.set(false);
      },
    });
  }
}