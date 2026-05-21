package com.example.backend.paquetes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaqueteCreateRequest(
  @NotBlank String titulo,
  String descripcion,
  @NotNull Long presio,
  String id_paquete,
  String imagenes,
  Boolean estado
) {}
