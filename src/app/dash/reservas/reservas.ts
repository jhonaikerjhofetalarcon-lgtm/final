import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, ReservaDto } from '../../core/g7-api.service';

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

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.api.getReservas().subscribe({
      next: (data) => this.reservas = data,
      error: () => console.error('Error cargando reservas')
    });
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
}