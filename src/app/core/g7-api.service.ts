import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';




export interface PaqueteDto {
  id: string;
  titulo: string;
  descripcion: string;
  presio: number;
  id_paquete: string;
  imagenes: string;
  estado: boolean;
}

export interface OfertaDto {
  id: string;
  titulo: string;
  descripcion: string;
  descuento: number;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
  paqueteId: string;
}

export interface PaqueteCreatePayload {
  titulo: string;
  descripcion: string;
  presio: number;
  id_paquete: string;
  imagenes: string;
}

export interface OfertaCreatePayload {
  titulo: string;
  descripcion: string;
  descuento: number;
  fechaInicio: string;
  fechaFin: string;
  paqueteId: string;
}


export interface UserDto {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: 'admin' | 'conductor';
}

export interface UserCreatePayload {
  nombre: string;
  email: string;
  telefono: string;
  rol: 'admin' | 'conductor';
  password: string;
}

export interface UserUpdatePayload {
  nombre: string;
  email: string;
  telefono: string;
  rol: 'admin' | 'conductor';
  reservas?: number;
  password?: string;
}

export interface DestinoDto {
  id: string;
  label: string;
  title: string;
  desc: string;
  name: string;
  bg: string;
  thumb: string;
  idAuto?: string;
}

export interface DestinoCreatePayload {
  label: string;
  title: string;
  desc?: string;
  name: string;
  bg?: string;
  thumb?: string;
  idAuto?: string;
}

export interface DestinoUpdatePayload {
  label?: string;
  title?: string;
  desc?: string;
  name?: string;
  bg?: string;
  thumb?: string;
  idAuto?: string;
}

export interface TourDto {
  id: string;
  nombre: string;
  descripcion: string;
  destinoId: string;
  precioAdulto: number;
  precioNino: number;
  duracionDias: number;
  cuposTotal: number;
  cuposDisponibles: number;
  dificultad: string;
  incluye: string;
  noIncluye: string;
  imagenUrl: string;
  activo: boolean;
  creadoEn: string;
}

export interface TourCreatePayload {
  nombre: string;
  descripcion: string;
  destinoId: string;
  precioAdulto: number;
  precioNino: number;
  duracionDias: number;
  cuposTotal: number;
  dificultad: string;
  incluye: string;
  noIncluye: string;
  imagenUrl: string;
}

export interface ReservaDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  dni: number;
  clase: string;
  notas: string;
  createdAt: string;
}

export interface ReservaCreatePayload {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  destino: string;
  fechaIda: string;
  fechaVuelta: string;
  dni: number;
  clase: string;
  notas: string;
}

export interface PagoDto {
  id: string;
  reservaId: string;
  monto: number;
  metodo: string;
  estado: string;
  referencia: string;
  comprobanteUrl: string;
  fechaPago: string;
}

export interface PagoCreatePayload {
  reservaId: string;
  monto: number;
  metodo: string;
  referencia: string;
  comprobanteUrl: string;
}

export interface AutoDto {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  color: string;
  anioFabrica: number;
  cantidadAsiento: number;
  tipo: string;
  conductor: string;
  estado: string;
}

export interface AsientoDto {
  id: string;
  idAuto: string;
  numeroAsiento: string;
  estado: 'libre' | 'reservado' | 'ocupado';
  idReserva?: string | null;
}

export interface AsientoCreatePayload {
  idAuto: string;
  numeroAsiento: string;
  estado?: 'libre' | 'reservado' | 'ocupado';
}


export interface ResenaDto {
  id: string;
  tourId: string;
  clienteId: string;
  calificacion: number;
  titulo: string;
  comentario: string;
  verificada: boolean;
  fecha: string;
}

export interface ResenaCreatePayload {
  tourId: string;
  clienteId: string;
  calificacion: number;
  titulo: string;
  comentario: string;
}

export interface ContactoCreatePayload {
  nombre: string;
  email: string;
  mensaje: string;
}

interface Pasajero {
  nombre: string;
  apellido: string;
  dni: number;
  email: string;
  telefono: string;
}

@Injectable({ providedIn: 'root' })
export class G7ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  health(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${this.base}/health`);
  }

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/users`);
  }

  getUser(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.base}/users/${encodeURIComponent(id)}`);
  }

  createUser(body: UserCreatePayload): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.base}/users`, body);
  }

  updateUser(id: string, body: UserCreatePayload): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.base}/users/${encodeURIComponent(id)}`, body);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${encodeURIComponent(id)}`);
  }

getDestinos(): Observable<DestinoDto[]> {
    return this.http.get<DestinoDto[]>(`${this.base}/destinos`);
  }

  createDestino(body: DestinoCreatePayload): Observable<DestinoDto> {
    return this.http.post<DestinoDto>(`${this.base}/destinos`, body);
  }

  updateDestino(id: string, body: DestinoUpdatePayload): Observable<DestinoDto> {
    return this.http.put<DestinoDto>(`${this.base}/destinos/${encodeURIComponent(id)}`, body);
  }

  deleteDestino(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/destinos/${encodeURIComponent(id)}`);
  }


  getTours(destinoId?: string): Observable<TourDto[]> {
    const url = destinoId
      ? `${this.base}/tours?destinoId=${encodeURIComponent(destinoId)}`
      : `${this.base}/tours`;
    return this.http.get<TourDto[]>(url);
  }

  getTour(id: string): Observable<TourDto> {
    return this.http.get<TourDto>(`${this.base}/tours/${encodeURIComponent(id)}`);
  }

  createTour(body: TourCreatePayload): Observable<TourDto> {
    return this.http.post<TourDto>(`${this.base}/tours`, body);
  }

  updateTour(id: string, body: TourCreatePayload): Observable<TourDto> {
    return this.http.put<TourDto>(`${this.base}/tours/${encodeURIComponent(id)}`, body);
  }

  deleteTour(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tours/${encodeURIComponent(id)}`);
  }


  getReservas(): Observable<ReservaDto[]> {
    return this.http.get<ReservaDto[]>(`${this.base}/reservas`);
  }

  createReserva(body: ReservaCreatePayload): Observable<ReservaDto> {
    return this.http.post<ReservaDto>(`${this.base}/reservas`, body);
  }

  deleteReserva(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/reservas/${encodeURIComponent(id)}`);
  }

  getPagos(reservaId?: string): Observable<PagoDto[]> {
    const url = reservaId
      ? `${this.base}/pagos?reservaId=${encodeURIComponent(reservaId)}`
      : `${this.base}/pagos`;
    return this.http.get<PagoDto[]>(url);
  }

  createPago(body: PagoCreatePayload): Observable<PagoDto> {
    return this.http.post<PagoDto>(`${this.base}/pagos`, body);
  }

  confirmarPago(id: string): Observable<PagoDto> {
    return this.http.patch<PagoDto>(`${this.base}/pagos/${encodeURIComponent(id)}/confirmar`, {});
  }


  getResenas(tourId?: string): Observable<ResenaDto[]> {
    const url = tourId
      ? `${this.base}/resenas?tourId=${encodeURIComponent(tourId)}`
      : `${this.base}/resenas`;
    return this.http.get<ResenaDto[]>(url);
  }

  createResena(body: ResenaCreatePayload): Observable<ResenaDto> {
    return this.http.post<ResenaDto>(`${this.base}/resenas`, body);
  }

  verificarResena(id: string): Observable<ResenaDto> {
    return this.http.patch<ResenaDto>(`${this.base}/resenas/${encodeURIComponent(id)}/verificar`, {});
  }


  createContacto(body: ContactoCreatePayload): Observable<unknown> {
    return this.http.post(`${this.base}/contacto`, body);
  }

getAutos(): Observable<AutoDto[]> {
    return this.http.get<AutoDto[]>(`${this.base}/autos`);
  }

  createAuto(body: any): Observable<AutoDto> {
    return this.http.post<AutoDto>(`${this.base}/autos`, body);
  }

  updateAuto(id: string, body: any): Observable<AutoDto> {
    return this.http.put<AutoDto>(`${this.base}/autos/${encodeURIComponent(id)}`, body);
  }

  deleteAuto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/autos/${encodeURIComponent(id)}`);
  }

  getAsientos(): Observable<AsientoDto[]> {
    return this.http.get<AsientoDto[]>(`${this.base}/asientos`);
  }

  createAsiento(body: AsientoCreatePayload): Observable<AsientoDto> {
    return this.http.post<AsientoDto>(`${this.base}/asientos`, body);
  }

  liberarAsiento(id: string): Observable<any> {
    return this.http.patch(`${this.base}/asientos/${encodeURIComponent(id)}/liberar`, {});
  }

  deleteAsiento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/asientos/${encodeURIComponent(id)}`);
  }


  getPaquetes(): Observable<PaqueteDto[]> {
    return this.http.get<PaqueteDto[]>(`${this.base}/paquetes`);
  }

  createPaquete(body: PaqueteCreatePayload): Observable<PaqueteDto> {
    return this.http.post<PaqueteDto>(`${this.base}/paquetes`, body);
  }

  deletePaquete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/paquetes/${encodeURIComponent(id)}`);
  }


  getOfertas(): Observable<OfertaDto[]> {
    return this.http.get<OfertaDto[]>(`${this.base}/ofertas`);
  }

  getOfertasActivas(): Observable<OfertaDto[]> {
    return this.http.get<OfertaDto[]>(`${this.base}/ofertas/activas`);
  }

  createOferta(body: OfertaCreatePayload): Observable<OfertaDto> {
    return this.http.post<OfertaDto>(`${this.base}/ofertas`, body);
  }

  deleteOferta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/ofertas/${encodeURIComponent(id)}`);
  }

  updateAsiento(id: string, body: any): Observable<AsientoDto> {
  return this.http.put<AsientoDto>(`${this.base}/asientos/${encodeURIComponent(id)}`, body);
}





}