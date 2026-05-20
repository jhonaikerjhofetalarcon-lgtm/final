package com.example.backend.destinos;

import jakarta.validation.constraints.NotBlank;

public record DestinoUpdateRequest(
  @NotBlank String label,
  @NotBlank String title,
  @NotBlank String desc,
  @NotBlank String name,
  @NotBlank String bg,
  String thumb,
  String idAuto) {
}
