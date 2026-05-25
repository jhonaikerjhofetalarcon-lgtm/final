import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, DestinoDto } from '../../core/g7-api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private api = inject(G7ApiService);

  apiOk: boolean | null = null;
  destinos: DestinoDto[] = [];
  destinosFiltrados: DestinoDto[] = [];

  // Filtros
  filtro = {
    manana: false,
    tarde: false,
    noche: false,
    precioMax: 1800,
    duracion: ''
  };

  ngOnInit() {
    this.verificarApi();
    this.cargarDestinos();
  }

  verificarApi() {
    this.api.health().subscribe({
      next: (r) => (this.apiOk = r?.status?.toLowerCase() === 'ok'),
      error: () => (this.apiOk = false),
    });
  }

  cargarDestinos() {
    this.api.getDestinos().subscribe({
      next: (data) => {
        this.destinos = data.length > 0 ? data : this.getDestinosRespaldo();
        this.filtrar();
      },
      error: () => {
        this.destinos = this.getDestinosRespaldo();
        this.filtrar();
      }
    });
  }

  filtrar() {
    this.destinosFiltrados = this.destinos.filter(d => {
      // Filtro por precio (simple)
      return true; // Puedes mejorar según precio real
    });
  }

  seleccionarDestino(destino: DestinoDto) {
    localStorage.setItem('destinoSeleccionado', JSON.stringify(destino));
  }

  precioDestino(destino: DestinoDto): string {
    const texto = `${destino.name || ''} ${destino.desc || ''}`;
    const match = texto.match(/S\/\.?\s*(\d+(?:\.\d{1,2})?)/i);
    return match ? `Desde S/ ${match[1]}` : 'Consultar precio';
  }

  private getDestinosRespaldo(): DestinoDto[] {
    return [ /* tus destinos de respaldo */ ];
  }
}