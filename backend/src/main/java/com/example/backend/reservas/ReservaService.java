package com.example.backend.reservas;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ReservaService {

  private final ReservaRepository repo;

  public ReservaService(ReservaRepository repo) {
    this.repo = repo;
  }

  public List<ReservaResponse> list() {
    return repo.findAllOrderByCreatedAtDesc().stream().map(ReservaResponse::from).toList();
  }

  public ReservaResponse get(String id) {
    return ReservaResponse.from(
      repo.findById(id).orElseThrow(() -> new NoSuchElementException("Reserva no encontrada")));
  }

  public ReservaResponse create(ReservaCreateRequest req) {
    if (req.fechaVuelta().isBefore(req.fechaIda())) {
      throw new IllegalArgumentException("La fecha de vuelta no puede ser anterior a la fecha de ida");
    }

    ReservaEntity e = new ReservaEntity();
    e.setId(UUID.randomUUID().toString());
    e.setNombre(req.nombre());
    e.setApellido(req.apellido());
    e.setEmail(req.email());
    e.setTelefono(req.telefono());
    e.setDestino(req.destino());
    e.setFechaIda(req.fechaIda());
    e.setFechaVuelta(req.fechaVuelta());
    e.setDni(req.dni());
    e.setIdAsiento(req.idAsiento());
    e.setNotas(req.notas());
    e.setOrigen(req.origen());           // ← NUEVO
    e.setCreatedAt(Instant.now());

    return ReservaResponse.from(repo.save(e));
  }

  public void delete(String id) {
    if (!repo.existsById(id)) throw new NoSuchElementException("Reserva no encontrada");
    repo.deleteById(id);
  }
}
