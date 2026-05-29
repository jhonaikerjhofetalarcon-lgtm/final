package com.example.backend.reservas;

import java.time.Instant;
import java.time.LocalDate;

public record ReservaResponse(
  String id,
  String nombre,
  String apellido,
  String email,
  String telefono,
  String destino,
  LocalDate fechaIda,
  LocalDate fechaVuelta,
  int dni,
  String idAsiento,
  String notas,
  String origen,           // ← NUEVO
  Instant createdAt
) {

  public static ReservaResponse from(ReservaEntity e) {
    return new ReservaResponse(
      e.getId(),
      e.getNombre(),
      e.getApellido(),
      e.getEmail(),
      e.getTelefono(),
      e.getDestino(),
      e.getFechaIda(),
      e.getFechaVuelta(),
      e.getDni(),
      e.getIdAsiento(),
      e.getNotas(),
      e.getOrigen(),
      e.getCreatedAt()
    );
  }
}
