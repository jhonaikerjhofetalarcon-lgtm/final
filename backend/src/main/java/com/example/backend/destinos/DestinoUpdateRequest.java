package com.example.backend.destinos;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record DestinoUpdateRequest(
  @NotBlank String label,
  @NotBlank String title,
  @NotBlank String desc,
  @NotBlank String name,
  @NotBlank String bg,
  String thumb,
  List<String> idAutos) {}     // ← Cambiado a List
