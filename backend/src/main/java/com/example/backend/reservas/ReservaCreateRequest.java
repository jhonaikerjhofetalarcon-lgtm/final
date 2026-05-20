package com.example.backend.reservas;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
  @NotNull int dni,                    // ← cambiado
  @NotBlank String idAsiento,         // ← nuevo
  String notas) {}
