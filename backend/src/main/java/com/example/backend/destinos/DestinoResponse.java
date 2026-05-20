package com.example.backend.destinos;

public record DestinoResponse(
  String id,
  String label,
  String title,
  String desc,
  String name,
  String bg,
  String thumb,
  String idAuto) {     // ← Agregado

  public static DestinoResponse from(DestinoEntity e) {
    return new DestinoResponse(
      e.getId(),
      e.getLabel(),
      e.getTitle(),
      e.getDesc(),
      e.getName(),
      e.getBg(),
      e.getThumb(),
      e.getIdAuto()
    );
  }
}
