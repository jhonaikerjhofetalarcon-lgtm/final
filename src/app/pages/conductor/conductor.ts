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
  manifiestos = signal<Array<{ fecha: string; destino?: string; pasajeros: PasajeroManifiesto[] }>>([]);
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

  filasManifiestoPara(pasajeros: PasajeroManifiesto[]): Array<PasajeroManifiesto | null> {
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

    // Agrupar por fechaIda y destino para generar un manifiesto por fecha+destino
    const grupos = new Map<string, PasajeroManifiesto[]>();
    for (const p of pasajeros) {
      const f = String(p.fechaIda || '').slice(0, 10) || 'sin-fecha';
      const destNorm = this.normalizar(String(p.destino || 'sin-destino'));
      const key = `${f}||${destNorm}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(p);
    }

    const manifiestos = Array.from(grupos.entries()).map(([key, lista]) => {
      const [fecha, destNorm] = key.split('||');
      const destinoReal = lista[0]?.destino || '';
      return {
        fecha,
        destino: destinoReal,
        pasajeros: lista.sort((a, b) => this.numeroAsiento(a.numeroAsiento) - this.numeroAsiento(b.numeroAsiento))
      };
    });

    // Ordenar para que las fechas más próximas (futuras o hoy) aparezcan primero
    const hoyTs = Date.parse(hoy);
    manifiestos.sort((A, B) => {
      if (A.fecha === 'sin-fecha') return 1;
      if (B.fecha === 'sin-fecha') return -1;
      const aTs = Date.parse(A.fecha);
      const bTs = Date.parse(B.fecha);
      const aDelta = aTs - hoyTs;
      const bDelta = bTs - hoyTs;
      const aKey = aDelta >= 0 ? aDelta : Math.abs(aDelta) + 1e12;
      const bKey = bDelta >= 0 ? bDelta : Math.abs(bDelta) + 1e12;
      return aKey - bKey;
    });

    this.pasajeros.set(pasajeros);
    this.manifiestos.set(manifiestos);
    this.error.set(null);
    this.cargando.set(false);
  }

  private normalizar(valor: string): string {
    return valor.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private numeroAsiento(valor: string): number {
    return Number(String(valor || '').replace(/\D/g, '')) || 999;
  }

  imprimirManifiesto(fecha: string, destinoBuscado?: string): void {
    const m = this.manifiestos().find(x => x.fecha === fecha && (destinoBuscado ? this.normalizar(x.destino || '') === this.normalizar(destinoBuscado) : true));
    if (!m) return;
    const docTitle = `Manifiesto - ${fecha}`;
    const minimoFilas = Math.max(30, Number(this.auto()?.cantidadAsiento) || 30);
    const destino = m.destino || m.pasajeros[0]?.destino || this.destinoPrincipal();
    const fechaFormateada = this.formatDateString(m.fecha);

    const style = `
      <style>
        @page { size: A4; margin: 20mm }
        body{font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#123;}
        .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #cfd8dc;padding-bottom:10px}
        .logo{width:70px;height:70px;border-radius:50%;border:4px solid #123;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#123}
        .title{flex:1;text-align:center}
        .title h1{margin:0;font-size:22px;letter-spacing:1px}
        .title .meta{margin-top:6px;font-size:12px}
        .manifest-number{color:#b71c1c;font-weight:bold;font-size:18px}
        .manifest-lines{display:flex;justify-content:space-between;margin-top:12px;flex-wrap:wrap}
        .manifest-lines .col{width:48%}
        .manifest-lines div{padding:6px 0;border-bottom:1px dotted #ccc}
        h3{margin-top:14px;color:#123}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        thead th{background:#123a66;color:white;padding:10px;font-weight:700}
        tbody td{border:1px solid #123a66;padding:8px;height:28px}
        tbody tr td:first-child{width:40px;text-align:center}
        tbody tr td:nth-child(2){width:60px;text-align:center}
        .observaciones{margin-top:14px}
      </style>`;

    // construir filas fijas hasta minimoFilas
    const rows = Array.from({ length: minimoFilas }).map((_, i) => {
      const p = m.pasajeros[i];
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${p?.numeroAsiento || ''}</td>
          <td>${p?.nombre || ''}</td>
          <td>${p?.apellido || ''}</td>
          <td>${p?.dni || ''}</td>
          <td>${p?.email || ''}</td>
          <td>${p?.telefono || ''}</td>
          <td>${p?.origen || ''}</td>
          <td></td>
        </tr>`;
    }).join('');

    // inline SVG logo simple
    const logoSvg = `<div class="logo">G7</div>`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${docTitle}</title>${style}</head><body>
      <div class="header">
        ${logoSvg}
        <div class="title">
          <h1>TURISMO G7 TRAVEL R&H SAC.</h1>
          <div class="meta">RUC: 20614645165 &nbsp;&nbsp; ASOC. BOSQUE DE NAWINPUQUIO SAN JUAN BAUTISTA AYACUCHO HUAMANGA</div>
          <div class="meta">Cel: 966 749075 - 980 398 544</div>
        </div>
        <div class="manifest-number">N 000208</div>
      </div>

      <div class="manifest-lines">
        <div class="col">
          <div><strong>CONDUCTOR:</strong> ${this.conductor()?.nombre || ''}</div>
          <div><strong>ORIGEN:</strong> ${this.origenEmpresa}</div>
          <div><strong>MODALIDAD DE SERVICIO:</strong> Turismo</div>
          <div><strong>N DE PLACA:</strong> ${this.auto()?.placa || ''}</div>
        </div>
        <div class="col">
          <div><strong>N LIC. DE CONDUCIR:</strong> ${this.licenciaConductor() || '-'}</div>
          <div><strong>DESTINO:</strong> ${destino}</div>
          <div><strong>FECHA DE VIAJE:</strong> ${fechaFormateada}</div>
          <div><strong>GUIA:</strong></div>
        </div>
      </div>

      <h3>MANIFIESTO DE USUARIOS - ${fechaFormateada}</h3>

      <table>
        <thead>
          <tr>
            <th>N</th>
            <th>ASIENTO</th>
            <th>NOMBRE</th>
            <th>APELLIDO</th>
            <th>DNI</th>
            <th>EMAIL</th>
            <th>TELEFONO</th>
            <th>ORIGEN</th>
            <th>FIRMA</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="observaciones"><strong>OBSERVACIONES</strong><div style="height:80px;border:1px solid #ddd;margin-top:6px"></div></div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  }

  private formatDateString(fecha: string): string {
    if (!fecha || fecha === 'sin-fecha') return 'Sin fecha';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return String(fecha).slice(0, 10);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return String(fecha).slice(0, 10);
    }
  }
}
