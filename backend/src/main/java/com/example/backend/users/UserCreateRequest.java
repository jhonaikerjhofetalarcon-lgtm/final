package com.example.backend.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
  @NotBlank String nombre,
  @NotBlank @Email String email,
  @NotBlank String telefono,
  @NotNull UserRole rol,
  @NotBlank @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres") String password,

  // Campos para Conductor
  String licencia,
  String tipoLicencia,
  String fechaVencimientoLicencia,
  Integer experienciaAnios,
  String tipoVehiculo
) {}
