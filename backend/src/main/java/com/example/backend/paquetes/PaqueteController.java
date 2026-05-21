package com.example.backend.paquetes;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/paquetes")
public class PaqueteController {
  private final PaqueteService service;

  public PaqueteController(PaqueteService service) {
    this.service = service;
  }

  @GetMapping
  public List<PaqueteResponse> listar() {
    return service.getAll();
  }

  @GetMapping("/{id}")
  public PaqueteResponse obtener(@PathVariable String id) {
    return service.getById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public PaqueteResponse crear(@RequestBody @Valid PaqueteCreateRequest req) {
    return service.create(req);
  }

  @PutMapping("/{id}")
  public PaqueteResponse actualizar(@PathVariable String id, @RequestBody @Valid PaqueteCreateRequest req) {
    return service.update(id, req);
  }

  @PatchMapping("/{id}/toggle")
  public PaqueteResponse cambiarEstado(@PathVariable String id) {
    return service.toggleEstado(id);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void eliminar(@PathVariable String id) {
    service.delete(id);
  }
}
