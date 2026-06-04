package com.example.backend.reservas;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDate;

public class ReservaEntity {

  private String id;

  @NotBlank private String nombre;
  @NotBlank private String apellido;
  @NotBlank @Email private String email;
  @NotBlank private String telefono;
  @NotBlank private String destino;

  private LocalDate fechaIda;
  private LocalDate fechaVuelta;

  private int dni;
  private String idAsiento;
  private String notas;
  private Instant createdAt;

  private String origen;
  private String paqueteId;
  private String paqueteTitulo;
  private String paqueteCodigo;
  private Integer cantidadPersonas;
  private Double paquetePrecioUnitario;
  private Double paqueteDescuento;
  private Double paqueteMontoTotal;
  private String estadoReserva;
  private String estadoPago;

  // ==================== GETTERS Y SETTERS ====================

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }

  public String getApellido() { return apellido; }
  public void setApellido(String apellido) { this.apellido = apellido; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getTelefono() { return telefono; }
  public void setTelefono(String telefono) { this.telefono = telefono; }

  public String getDestino() { return destino; }
  public void setDestino(String destino) { this.destino = destino; }

  public LocalDate getFechaIda() { return fechaIda; }
  public void setFechaIda(LocalDate fechaIda) { this.fechaIda = fechaIda; }

  public LocalDate getFechaVuelta() { return fechaVuelta; }
  public void setFechaVuelta(LocalDate fechaVuelta) { this.fechaVuelta = fechaVuelta; }

  public int getDni() { return dni; }
  public void setDni(int dni) { this.dni = dni; }

  public String getIdAsiento() { return idAsiento; }
  public void setIdAsiento(String idAsiento) { this.idAsiento = idAsiento; }

  public String getNotas() { return notas; }
  public void setNotas(String notas) { this.notas = notas; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public String getOrigen() { return origen; }
  public void setOrigen(String origen) { this.origen = origen; }

  public String getPaqueteId() { return paqueteId; }
  public void setPaqueteId(String paqueteId) { this.paqueteId = paqueteId; }

  public String getPaqueteTitulo() { return paqueteTitulo; }
  public void setPaqueteTitulo(String paqueteTitulo) { this.paqueteTitulo = paqueteTitulo; }

  public String getPaqueteCodigo() { return paqueteCodigo; }
  public void setPaqueteCodigo(String paqueteCodigo) { this.paqueteCodigo = paqueteCodigo; }

  public Integer getCantidadPersonas() { return cantidadPersonas; }
  public void setCantidadPersonas(Integer cantidadPersonas) { this.cantidadPersonas = cantidadPersonas; }

  public Double getPaquetePrecioUnitario() { return paquetePrecioUnitario; }
  public void setPaquetePrecioUnitario(Double paquetePrecioUnitario) { this.paquetePrecioUnitario = paquetePrecioUnitario; }

  public Double getPaqueteDescuento() { return paqueteDescuento; }
  public void setPaqueteDescuento(Double paqueteDescuento) { this.paqueteDescuento = paqueteDescuento; }

  public Double getPaqueteMontoTotal() { return paqueteMontoTotal; }
  public void setPaqueteMontoTotal(Double paqueteMontoTotal) { this.paqueteMontoTotal = paqueteMontoTotal; }

  public String getEstadoReserva() { return estadoReserva; }
  public void setEstadoReserva(String estadoReserva) { this.estadoReserva = estadoReserva; }

  public String getEstadoPago() { return estadoPago; }
  public void setEstadoPago(String estadoPago) { this.estadoPago = estadoPago; }
}
