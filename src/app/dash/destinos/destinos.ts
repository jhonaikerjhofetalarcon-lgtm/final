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
      const auto = this.autos.find(a => a.id === id);
      return auto ? `${auto.placa} — ${auto.marca} ${auto.modelo}` : 'Desconocido';
    });
    
    return nombres.join(', ');
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