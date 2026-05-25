package com.example.backend.email;

public class EmailConfirmacionRequest {

  private String to;
  private String nombre;
  private String destino;
  private String fecha;
  private String asientos;
  private int totalAsientos;

  // Getters y Setters
  public String getTo() {
    return to;
  }

  public void setTo(String to) {
    this.to = to;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getDestino() {
    return destino;
  }

  public void setDestino(String destino) {
    this.destino = destino;
  }

  public String getFecha() {
    return fecha;
  }

  public void setFecha(String fecha) {
    this.fecha = fecha;
  }

  public String getAsientos() {
    return asientos;
  }

  public void setAsientos(String asientos) {
    this.asientos = asientos;
  }

  public int getTotalAsientos() {
    return totalAsientos;
  }

  public void setTotalAsientos(int totalAsientos) {
    this.totalAsientos = totalAsientos;
  }
}
