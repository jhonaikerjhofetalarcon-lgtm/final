package com.example.backend.paquetes;

import java.util.List;

public record PaqueteResponse(
  String id,
  String titulo,
  String descripcion,
  long presio,
  String id_paquete,
  String imagenes,
  boolean estado,
  List<String> idAutos
) {
  public static PaqueteResponse from(PaqueteEntity e) {
    return new PaqueteResponse(
      e.getId(),
      e.getTitulo() != null ? e.getTitulo() : "",
      e.getDescripcion() != null ? e.getDescripcion() : "",
      e.getPresio() != null ? e.getPresio() : 0L,
      e.getId_paquete() != null ? e.getId_paquete() : "",
      e.getImagenes() != null ? e.getImagenes() : "",
      Boolean.TRUE.equals(e.getEstado()),
      e.getIdAutos() != null ? e.getIdAutos() : List.of()
    );
  }
}
