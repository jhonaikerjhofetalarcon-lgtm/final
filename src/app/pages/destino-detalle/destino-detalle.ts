import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { G7ApiService, DestinoDto, AutoDto } from '../../core/g7-api.service';

@Component({
  selector: 'app-destino-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './destino-detalle.html',
  styleUrls: ['./destino-detalle.css'],
})
export class DestinoDetalle implements OnInit {
  private api = inject(G7ApiService);
  private route = inject(ActivatedRoute);

  destino = signal<DestinoDto | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  autos: AutoDto[] = [];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDestino(id);
    }
  }

  cargarDestino(id: string) {
    this.api.getDestino(id).subscribe({
      next: (d) => {
        this.destino.set(d);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el destino');
        this.cargando.set(false);
      }
    });

    this.api.getAutos().subscribe({
      next: (autos) => this.autos = autos
    });
  }

  // ✅ Método requerido por el template
  getAutoInfo(idAutos?: string[]): string {
    if (!idAutos || idAutos.length === 0) {
      return 'Pendiente de asignar';
    }
    
    const nombres = idAutos.map(id => {
      const auto = this.autos.find(a => a.id === id);
      return auto ? `${auto.placa} — ${auto.marca} ${auto.modelo}` : 'Desconocido';
    });
    
    return nombres.join(', ');
  }
}