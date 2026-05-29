package com.example.backend.destinos;

import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

public class DestinoEntity {

  private String id;

  @NotBlank private String label;
  @NotBlank private String title;
  @NotBlank private String desc;
  @NotBlank private String name;
  @NotBlank private String bg;
  private String thumb;
  private List<String> idAutos = new ArrayList<>();   // ← Cambiado a lista

  // Getters y Setters
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }

  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getDesc() { return desc; }
  public void setDesc(String desc) { this.desc = desc; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }

  public String getBg() { return bg; }
  public void setBg(String bg) { this.bg = bg; }

  public String getThumb() { return thumb; }
  public void setThumb(String thumb) { this.thumb = thumb; }

  public List<String> getIdAutos() { return idAutos; }
  public void setIdAutos(List<String> idAutos) {
    this.idAutos = idAutos != null ? idAutos : new ArrayList<>();
  }
}
