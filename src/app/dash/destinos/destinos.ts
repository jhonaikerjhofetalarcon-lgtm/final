import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { G7ApiService, DestinoDto, AutoDto } from '../../core/g7-api.service';

@Component({
  selector: 'app-destinos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './destinos.html',
  styleUrls: ['./destinos.css'],
})
export class Destinos implements OnInit {
  private readonly api = inject(G7ApiService);

  busqueda = '';
  error: string | null = null;
  successMsg: string | null = null;
  formVisible = false;
  editingId: string | null = null;

  destinos: DestinoDto[] = [];
  autos: AutoDto[] = [];
  fDestino: any = this.empty();
  private originalDestino: DestinoDto | null = null;

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo() {
    this.api.getDestinos().subscribe({
      next: (d) => this.destinos = d,
      error: () => this.error = 'Error al cargar destinos'
    });

    this.api.getAutos().subscribe({
      next: (a) => this.autos = a,
      error: () => console.warn('No se pudieron cargar los autos')
    });
  }

  abrir(d?: DestinoDto): void {
    this.editingId = d?.id || null;
    this.fDestino = d ? { ...d } : this.empty();
    if (d?.idAutos?.length) {
      this.fDestino.idAutos = this.normalizarIdAutos(d.idAutos);
    }
    this.originalDestino = d ? { ...d } : null;
    this.formVisible = true;
    this.error = null;
  }

  cerrar(): void {
    this.formVisible = false;
    this.error = null;
  }

  guardar(): void {
    if (!this.fDestino.title?.trim() || !this.fDestino.name?.trim()) {
      this.error = 'Título y Nombre son obligatorios';
      return;
    }

    // Validar máximo 4 vehículos asignados
    if (this.fDestino.idAutos && this.fDestino.idAutos.length > 4) {
      this.error = 'No puedes asignar más de 4 vehículos a un destino.';
      return;
    }

    // Si estamos editando y el campo quedó vacío, confirmar antes de borrar asignaciones
    if (this.editingId && (!this.fDestino.idAutos || this.fDestino.idAutos.length === 0)) {
      const prev = this.originalDestino?.idAutos || [];
      if (prev.length > 0) {
        const ok = confirm('Este destino tiene vehículos asignados. Dejar el campo vacío eliminará esas asignaciones y afectará a reservas. ¿Confirmas borrar las asignaciones?');
        if (!ok) {
          // Restaurar la lista anterior y abortar el guardado
          this.fDestino.idAutos = [...prev];
          this.error = 'Operación cancelada. Las asignaciones se han preservado.';
          return;
        }
        // else: user confirmed, proceed with empty array to clear assignments
      }
    }

    const payload = {
      label: this.fDestino.label?.trim() || '',
      title: this.fDestino.title.trim(),
      desc: this.fDestino.desc?.trim() || '',
      name: this.fDestino.name.trim().toLowerCase(),
      bg: this.fDestino.bg?.trim() || '',
      thumb: this.fDestino.thumb?.trim() || '',
      idAutos: this.fDestino.idAutos || []   // ← Cambiado a array
    };

    if (this.editingId) {
      this.api.updateDestino(this.editingId, payload).subscribe({
        next: () => {
          this.flash('✅ Destino actualizado correctamente');
          this.cargarTodo();
          this.cerrar();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al actualizar destino';
        }
      });
    } else {
      this.api.createDestino(payload).subscribe({
        next: () => {
          this.flash('✅ Destino creado correctamente');
          this.cargarTodo();
          this.cerrar();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al crear destino';
        }
      });
    }
  }

  eliminar(d: DestinoDto): void {
    if (!confirm(`¿Eliminar "${d.title}"?`)) return;
    this.api.deleteDestino(d.id).subscribe({
      next: () => {
        this.flash('🗑 Destino eliminado');
        this.cargarTodo();
      },
      error: () => this.error = 'Error al eliminar destino'
    });
  }

  // ✅ Actualizado para múltiples vehículos
  getAutoInfo(idAutos?: string[]): string {
    if (!idAutos || idAutos.length === 0) {
      return 'Sin vehículo asignado';
    }
    
    const nombres = idAutos.map(id => {
      const auto = this.autos.find(a => this.autoCoincideConDestino(id, a));
      return auto ? `${auto.placa} — ${auto.marca} ${auto.modelo}` : 'Desconocido';
    });
    
    return nombres.join(', ');
  }

  private autoCoincideConDestino(idDestino: string, auto: AutoDto): boolean {
    const valor = String(idDestino || '').trim().toLowerCase();
    if (!valor) return false;
    const idAuto = String(auto.id || '').trim().toLowerCase();
    const placa = String(auto.placa || '').trim().toLowerCase();
    const modelo = `${auto.marca || ''} ${auto.modelo || ''}`.trim().toLowerCase();
    return idAuto === valor || placa === valor || modelo === valor;
  }

  private normalizarIdAutos(idAutos: string[] = []): string[] {
    return idAutos.map(id => {
      const valor = String(id || '').trim().toLowerCase();
      const auto = this.autos.find(a => this.autoCoincideConDestino(valor, a));
      return auto ? auto.id : id;
    });
  }

  filtrados(): DestinoDto[] {
    const q = this.busqueda.toLowerCase().trim();
    return q ? this.destinos.filter(d =>
      d.title?.toLowerCase().includes(q) || d.label?.toLowerCase().includes(q)
    ) : this.destinos;
  }

  private flash(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => (this.successMsg = null), 3000);
  } 

  private empty() {
    return { 
      label: '', 
      title: '', 
      desc: '', 
      name: '', 
      bg: '', 
      thumb: '', 
      idAutos: [] as string[] 
    };
  }
}