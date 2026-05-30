import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Añade RouterModule para que funcione el nav
import { G7ApiService, PaqueteDto, OfertaDto } from '../../core/g7-api.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    DecimalPipe,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule 
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {

  private readonly api = inject(G7ApiService);
  private readonly router = inject(Router);

  // UI
  activeSection: string = 'overview';
  busqueda = '';
  error: string | null = null;
  successMsg: string | null = null;

  // Datos existentes
  usuarios: any[] = [];
  destinos: any[] = [];
  tours: any[] = [];
  reservas: any[] = [];
  pagos: any[] = [];
  autos: any[] = [];
  asientos: any[] = [];

  // --- NUEVOS DATOS ---
  paquetes: PaqueteDto[] = [];
  ofertas: OfertaDto[] = [];

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargarUsuarios();
    this.cargarDestinos();
    this.cargarTours();
    this.cargarReservas();
    this.cargarPagos();
    this.cargarAutos();
    this.cargarAsientos();
    this.cargarPaquetes();
    this.cargarOfertas();
  }

  // --- NUEVOS MÉTODOS DE CARGA ---
  private cargarPaquetes(): void {
    this.api.getPaquetes().subscribe({
      next: (d) => this.paquetes = d || [],
      error: (err) => console.error('Error cargando paquetes:', err)
    });
  }

  private cargarOfertas(): void {
    this.api.getOfertas().subscribe({
      next: (d) => this.ofertas = d || [],
      error: (err) => console.error('Error cargando ofertas:', err)
    });
  }

  // Cargas individuales existentes
  private cargarUsuarios(): void {
    this.api.getUsers().subscribe({ next: (d) => this.usuarios = d || [], error: () => {} });
  }

  private cargarDestinos(): void {
    this.api.getDestinos().subscribe({ next: (d) => this.destinos = d || [], error: () => {} });
  }

  private cargarTours(): void {
    this.api.getTours().subscribe({ next: (d) => this.tours = d || [], error: () => {} });
  }

  private cargarReservas(): void {
    this.api.getReservas().subscribe({ next: (d) => this.reservas = d || [], error: () => {} });
  }

  private cargarPagos(): void {
    this.api.getPagos().subscribe({ next: (d) => this.pagos = d || [], error: () => {} });
  }

  private cargarAutos(): void {
    this.api.getAutos().subscribe({
      next: (d) => this.autos = d || [],
      error: (err) => console.error('Error cargando autos:', err)
    });
  }

  private cargarAsientos(): void {
    this.api.getAsientos().subscribe({
      next: (d) => this.asientos = d || [],
      error: (err) => console.error('Error cargando asientos:', err)
    });
  }

  setSection(section: string): void {
    this.activeSection = section;
    this.busqueda = '';
  
    this.router.navigate(['/dash', section]);
  }

  recargar(): void {
    this.cargarTodo();
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // --- NUEVAS ESTADÍSTICAS ---
  totalPaquetesActivos(): number {
    return this.paquetes.filter(p => p.estado !== false).length;
  }

  totalOfertasVigentes(): number {
    // Cuenta ofertas marcadas como activas
    return this.ofertas.filter(o => o.estado).length;
  }

  // Estadísticas existentes
  totalAdmins(): number {
    return this.usuarios.filter(u => u.rol === 'admin').length;
  }

  totalConductores(): number {
    return this.usuarios.filter(u => u.rol === 'conductor').length;
  }

  totalPasajeros(): number {
    return this.reservas.reduce((sum, r) => sum + (r.pasajeros || 0), 0);
  }

  autosActivos(): number {
    return this.autos.filter(a => a.estado === 'activo').length;
  }

  totalMontoPagos(): number {
    return this.pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
  }
}
