package com.example.backend.paquetes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record PaqueteCreateRequest(
  @NotBlank String titulo,
  String descripcion,
  @NotNull Long presio,
  String id_paquete,
  String imagenes,
  Boolean estado,
  List<String> idAutos
) {}
