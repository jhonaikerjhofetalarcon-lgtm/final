package com.example.backend.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserEntity {

  private String id;

  @NotBlank
  private String nombre;

  @NotBlank
  @Email
  private String email;

  @NotBlank
  private String telefono;

  @NotNull
  private UserRole rol;

  private String passwordHash;

  // ==================== CAMPOS PARA CONDUCTOR ====================
  private String licencia;
  private String tipoLicencia;
  private String fechaVencimientoLicencia;
  private Integer experienciaAnios;
  private String tipoVehiculo;

  // Getters y Setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getTelefono() { return telefono; }
  public void setTelefono(String telefono) { this.telefono = telefono; }

  public UserRole getRol() { return rol; }
  public void setRol(UserRole rol) { this.rol = rol; }

  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

  // Campos Conductor
  public String getLicencia() { return licencia; }
  public void setLicencia(String licencia) { this.licencia = licencia; }

  public String getTipoLicencia() { return tipoLicencia; }
  public void setTipoLicencia(String tipoLicencia) { this.tipoLicencia = tipoLicencia; }

  public String getFechaVencimientoLicencia() { return fechaVencimientoLicencia; }
  public void setFechaVencimientoLicencia(String fechaVencimientoLicencia) { this.fechaVencimientoLicencia = fechaVencimientoLicencia; }

  public Integer getExperienciaAnios() { return experienciaAnios; }
  public void setExperienciaAnios(Integer experienciaAnios) { this.experienciaAnios = experienciaAnios; }

  public String getTipoVehiculo() { return tipoVehiculo; }
  public void setTipoVehiculo(String tipoVehiculo) { this.tipoVehiculo = tipoVehiculo; }
}
