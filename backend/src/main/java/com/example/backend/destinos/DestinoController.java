package com.example.backend.destinos;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/destinos")
public class DestinoController {

  private final DestinoService service;

  public DestinoController(DestinoService service) {
    this.service = service;
  }

  @GetMapping
  public List<DestinoResponse> list() {
    return service.list();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public DestinoResponse create(@RequestBody DestinoCreateRequest req) {
    return service.create(req);
  }

  @PutMapping("/{id}")
  public DestinoResponse update(@PathVariable String id, @RequestBody DestinoUpdateRequest req) {
    return service.update(id, req);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    service.delete(id);
  }
}
