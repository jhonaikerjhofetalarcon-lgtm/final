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
    return [
      {
        id: 'respaldo-millpu',
        label: 'Full Day',
        title: 'Aguas Turquesas de Millpu',
        desc: 'Ruta natural desde Ayacucho hacia piscinas turquesas. Full day desde S/. 110 por persona.',
        name: 'Desde S/. 110',
        bg: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg',
        thumb: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg'
      },
      {
        id: 'respaldo-city-tour',
        label: 'Half Day',
        title: 'Ayacucho City Tour',
        desc: 'Recorrido por plazas, templos, miradores y casonas historicas. Desde S/. 50 por persona.',
        name: 'Desde S/. 50',
        bg: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg',
        thumb: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg'
      },
      {
        id: 'respaldo-quinua',
        label: 'Historico',
        title: 'Pampa de Quinua',
        desc: 'Visita historica a Quinua y la Pampa de Ayacucho. Half day desde S/. 65 por persona.',
        name: 'Desde S/. 65',
        bg: 'https://www.ytuqueplanes.com/imagenes/fotos/novedades/sierra-pampa-quinua.JPG',
        thumb: 'https://www.ytuqueplanes.com/imagenes/fotos/novedades/sierra-pampa-quinua.JPG'
      },
      {
        id: 'respaldo-vilcashuaman',
        label: 'Full Day',
        title: 'Vilcashuaman',
        desc: 'Ruta arqueologica al templo del Sol y la Luna. Full day desde S/. 90 por persona.',
        name: 'Desde S/. 90',
        bg: 'https://images.pexels.com/photos/2929906/pexels-photo-2929906.jpeg',
        thumb: 'https://images.pexels.com/photos/2929906/pexels-photo-2929906.jpeg'
      },
      {
        id: 'respaldo-huanta',
        label: 'Full Day',
        title: 'Pikimachay - Huanta',
        desc: 'Experiencia cultural y natural por Pikimachay y Huanta. Desde S/. 70 por persona.',
        name: 'Desde S/. 70',
        bg: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
        thumb: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg'
      },
      {
        id: 'respaldo-sarhua',
        label: 'Cultural',
        title: 'Sarhua',
        desc: 'Arte tradicional, paisajes andinos y cultura viva. Consulta salidas disponibles.',
        name: 'Consultar precio',
        bg: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg',
        thumb: 'https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg'
      }
    ];
  }
}
