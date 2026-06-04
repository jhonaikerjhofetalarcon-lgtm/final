package com.example.backend.reservas;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReservaCreateRequest(
  @NotBlank String nombre,
  @NotBlank String apellido,
  @NotBlank @Email String email,
  @NotBlank String telefono,
  @NotBlank String destino,
  @NotNull LocalDate fechaIda,
  @NotNull LocalDate fechaVuelta,
  @NotNull int dni,
  @NotBlank String idAsiento,
  String notas,

  String origen,
  String paqueteId,
  String paqueteTitulo,
  String paqueteCodigo,
  Integer cantidadPersonas,
  Double paquetePrecioUnitario,
  Double paqueteDescuento,
  Double paqueteMontoTotal,
  String estadoReserva,
  String estadoPago
) {}
