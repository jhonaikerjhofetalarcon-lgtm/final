package com.example.backend.reservas;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

  private final ReservaService service;

  public ReservaController(ReservaService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReservaResponse> list() {
    return service.list();
  }

  @GetMapping("/{id}")
  public ReservaResponse get(@PathVariable String id) {
    return service.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ReservaResponse create(@Valid @RequestBody ReservaCreateRequest req) {
    return service.create(req);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    service.delete(id);
  }
}
