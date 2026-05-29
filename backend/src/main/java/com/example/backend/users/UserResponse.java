package com.example.backend.users;

public record UserResponse(
  String id,
  String nombre,
  String email,
  String telefono,
  UserRole rol,

  // Campos para Conductor
  String licencia,
  String tipoLicencia,
  String fechaVencimientoLicencia,
  Integer experienciaAnios,
  String tipoVehiculo
) {

  public static UserResponse from(UserEntity e) {
    return new UserResponse(
      e.getId(),
      e.getNombre(),
      e.getEmail(),
      e.getTelefono(),
      e.getRol(),
      e.getLicencia(),
      e.getTipoLicencia(),
      e.getFechaVencimientoLicencia(),
      e.getExperienciaAnios(),
      e.getTipoVehiculo()
    );
  }
}
