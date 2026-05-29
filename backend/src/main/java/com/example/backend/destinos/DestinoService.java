package com.example.backend.destinos;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class DestinoService {

  private final DestinoRepository repo;

  public DestinoService(DestinoRepository repo) {
    this.repo = repo;
  }

  public List<DestinoResponse> list() {
    return repo.findAllOrderByTitle()
      .stream()
      .map(DestinoResponse::from)
      .toList();
  }

  public DestinoResponse get(String id) {
    return DestinoResponse.from(repo.getOrThrow(id));
  }

  public DestinoResponse create(DestinoCreateRequest req) {
    DestinoEntity e = new DestinoEntity();
    e.setId(UUID.randomUUID().toString());
    e.setLabel(req.label());
    e.setTitle(req.title());
    e.setDesc(req.desc());
    e.setName(req.name());
    e.setBg(req.bg());
    e.setThumb(req.thumb() != null ? req.thumb() : "");
    e.setIdAutos(req.idAutos());           // ← Corregido

    return DestinoResponse.from(repo.save(e));
  }

  public DestinoResponse update(String id, DestinoUpdateRequest req) {
    DestinoEntity e = repo.getOrThrow(id);

    e.setLabel(req.label());
    e.setTitle(req.title());
    e.setDesc(req.desc());
    e.setName(req.name());
    e.setBg(req.bg());
    if (req.thumb() != null) e.setThumb(req.thumb());
    e.setIdAutos(req.idAutos());           // ← Corregido

    return DestinoResponse.from(repo.save(e));
  }

  public void delete(String id) {
    if (!repo.existsById(id)) {
      throw new NoSuchElementException("Destino no encontrado");
    }
    repo.deleteById(id);
  }
}
