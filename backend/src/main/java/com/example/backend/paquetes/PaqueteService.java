package com.example.backend.paquetes;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PaqueteService {
  private final PaqueteRepository repository;

  public PaqueteService(PaqueteRepository repository) {
    this.repository = repository;
  }

  public List<PaqueteResponse> getAll() {
    return repository.findAll().stream().map(PaqueteResponse::from).toList();
  }

  public PaqueteResponse getById(String id) {
    return PaqueteResponse.from(repository.getOrThrow(id));
  }

  public PaqueteResponse create(PaqueteCreateRequest req) {
    PaqueteEntity e = new PaqueteEntity();
    e.setId(UUID.randomUUID().toString());
    applyRequest(e, req);
    e.setEstado(req.estado() != null ? req.estado() : true);
    return PaqueteResponse.from(repository.save(e));
  }

  public PaqueteResponse update(String id, PaqueteCreateRequest req) {
    PaqueteEntity e = repository.getOrThrow(id);
    applyRequest(e, req);
    e.setEstado(req.estado() != null ? req.estado() : Boolean.TRUE.equals(e.getEstado()));
    return PaqueteResponse.from(repository.save(e));
  }

  public PaqueteResponse toggleEstado(String id) {
    PaqueteEntity e = repository.getOrThrow(id);
    e.setEstado(!Boolean.TRUE.equals(e.getEstado()));
    return PaqueteResponse.from(repository.save(e));
  }

  public void delete(String id) {
    repository.deleteById(id);
  }

  private void applyRequest(PaqueteEntity e, PaqueteCreateRequest req) {
    e.setTitulo(req.titulo());
    e.setDescripcion(req.descripcion());
    e.setPresio(req.presio());
    e.setId_paquete(req.id_paquete());
    e.setImagenes(req.imagenes());
    e.setIdAutos(req.idAutos());
  }
}
