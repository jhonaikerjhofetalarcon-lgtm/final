import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, forkJoin, of, timeout } from 'rxjs';
import { AsientoDto, AutoDto, G7ApiService, ReservaDto, UserDto } from '../../core/g7-api.service';
import { AuthService } from '../../core/Auth.service';

interface PasajeroManifiesto extends ReservaDto {
  numeroAsiento: string;
}

@Component({
  selector: 'app-conductor',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './conductor.html',
  styleUrl: './conductor.css',
})
export class Conductor implements OnInit {
  private readonly api = inject(G7ApiService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  cargando = signal(true);
  error = signal<string | null>(null);

  auto = signal<AutoDto | null>(null);
  pasajeros = signal<PasajeroManifiesto[]>([]);
  licenciaConductor = signal<string>('-');

  conductor = computed(() => this.auth.currentUser());
  destinoPrincipal = computed(() => this.pasajeros()[0]?.destino || '-');
  fechaViaje = computed(() => this.pasajeros()[0]?.fechaIda || null);
  origenEmpresa = 'Ayacucho - Huamanga';

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.auth.isConductor) {
      this.cargando.set(false);
      this.router.navigate(this.auth.isAdmin ? ['/dash/overview'] : ['/home']);
      return;
    }

    setTimeout(() => {
      if (this.cargando()) {
        this.error.set('La carga del manifiesto esta tardando demasiado. Verifica autos, asientos y reservas en el backend.');
        this.cargando.set(false);
      }
    }, 10000);

    forkJoin({
      autos: this.api.getAutos().pipe(timeout(8000), catchError(() => of([] as AutoDto[]))),
      asientos: this.api.getAsientos().pipe(timeout(8000), catchError(() => of([] as AsientoDto[]))),
      reservas: this.api.getReservas().pipe(timeout(8000), catchError(() => of([] as ReservaDto[]))),
      usuarios: this.api.getUsers().pipe(timeout(8000), catchError(() => of([] as UserDto[]))),
    }).pipe(timeout(8000)).subscribe({
      next: ({ autos, asientos, reservas, usuarios }) => {
        try {
          this.prepararManifiesto(autos || [], asientos || [], reservas || [], usuarios || []);
        } catch (error) {
          console.error(error);
          this.error.set('No se pudo preparar el manifiesto con los datos recibidos del backend.');
          this.cargando.set(false);
        }
      },
      error: () => {
        this.error.set('No se pudo cargar el manifiesto. Verifica que el backend este encendido.');
        this.cargando.set(false);
      }
    });
  }

  imprimir(): void {
    window.print();
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  filasManifiesto(): Array<PasajeroManifiesto | null> {
    const pasajeros = this.pasajeros();
    const minimoFilas = Math.max(30, this.auto()?.cantidadAsiento || 0);
    return Array.from({ length: minimoFilas }, (_, i) => pasajeros[i] || null);
  }

  private prepararManifiesto(autos: AutoDto[], asientos: AsientoDto[], reservas: ReservaDto[], usuarios: UserDto[]): void {
    const user = this.auth.currentUser();
    const nombreConductor = this.normalizar(user?.nombre || '');
    const emailConductor = this.normalizar(user?.email || '');
    const datosConductor = usuarios.find(u =>
      this.normalizar(u.email || '') === emailConductor ||
      this.normalizar(u.nombre || '') === nombreConductor
    );

    this.licenciaConductor.set(datosConductor?.licencia || '-');

    const autoAsignado = autos.find(a => this.normalizar(a.conductor || '') === nombreConductor) || null;
    this.auto.set(autoAsignado);

    if (!autoAsignado) {
      this.error.set('No tienes un carro asignado. Pide al administrador que te asigne uno.');
      this.cargando.set(false);
      return;
    }

    const asientosAuto = asientos.filter(a => a.idAuto === autoAsignado.id);
    const asientoPorId = new Map(asientosAuto.map(a => [a.id, a]));
    const hoy = new Date().toISOString().slice(0, 10);

    const pasajeros = reservas
      .filter(r => asientoPorId.has(r.idAsiento))
      .filter(r => !r.fechaIda || String(r.fechaIda).slice(0, 10) >= hoy)
      .map(r => ({
        ...r,
        numeroAsiento: asientoPorId.get(r.idAsiento)?.numeroAsiento || ''
      }))
      .sort((a, b) => {
        const fecha = String(a.fechaIda).localeCompare(String(b.fechaIda));
        if (fecha !== 0) return fecha;
        return this.numeroAsiento(a.numeroAsiento) - this.numeroAsiento(b.numeroAsiento);
      });

    this.pasajeros.set(pasajeros);
    this.error.set(null);
    this.cargando.set(false);
  }

  private normalizar(valor: string): string {
    return valor.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private numeroAsiento(valor: string): number {
    return Number(String(valor || '').replace(/\D/g, '')) || 999;
  }
}
