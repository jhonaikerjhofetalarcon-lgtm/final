package com.example.backend.reservas;

import static com.example.backend.firestore.FirestoreFutures.get;

import com.example.backend.firestore.FirestoreCollections;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class ReservaRepository {

  private final CollectionReference col;

  public ReservaRepository(Firestore db) {
    this.col = db.collection(FirestoreCollections.RESERVAS);
  }

  public List<ReservaEntity> findAllOrderByCreatedAtDesc() {
    QuerySnapshot snap = get(col.orderBy("createdAt",
      com.google.cloud.firestore.Query.Direction.DESCENDING).get());
    return snap.getDocuments().stream().map(this::toEntity).toList();
  }

  public Optional<ReservaEntity> findById(String id) {
    DocumentSnapshot doc = get(col.document(id).get());
    if (!doc.exists()) return Optional.empty();
    return Optional.of(toEntity(doc));
  }

  public boolean existsById(String id) {
    return get(col.document(id).get()).exists();
  }

  public ReservaEntity save(ReservaEntity e) {
    if (e.getId() == null || e.getId().isBlank())
      throw new IllegalArgumentException("id requerido");

    Map<String, Object> data = new HashMap<>();
    data.put("nombre",      e.getNombre());
    data.put("apellido",    e.getApellido());
    data.put("email",       e.getEmail());
    data.put("telefono",    e.getTelefono());
    data.put("destino",     e.getDestino());
    data.put("fechaIda",    e.getFechaIda() != null ? e.getFechaIda().toString() : "");
    data.put("fechaVuelta", e.getFechaVuelta() != null ? e.getFechaVuelta().toString() : "");
    data.put("dni", e.getDni());
    data.put("idAsiento", e.getIdAsiento() != null ? e.getIdAsiento() : "");
    data.put("notas",       e.getNotas() != null ? e.getNotas() : "");

    data.put("createdAt",   e.getCreatedAt() != null ? e.getCreatedAt().toString() : Instant.now().toString());

    get(col.document(e.getId()).set(data));
    return e;
  }

  public void deleteById(String id) {
    get(col.document(id).delete());
  }

  private ReservaEntity toEntity(DocumentSnapshot d) {
    ReservaEntity e = new ReservaEntity();
    e.setId(d.getId());
    e.setNombre(safeStr(d, "nombre"));
    e.setApellido(safeStr(d, "apellido"));
    e.setEmail(safeStr(d, "email"));
    e.setTelefono(safeStr(d, "telefono"));
    e.setDestino(safeStr(d, "destino"));
    e.setNotas(safeStr(d, "notas"));

    String fechaIda = safeStr(d, "fechaIda");
    if (!fechaIda.isBlank()) {
      try { e.setFechaIda(LocalDate.parse(fechaIda)); } catch (Exception ignored) {}
    }

    String fechaVuelta = safeStr(d, "fechaVuelta");
    if (!fechaVuelta.isBlank()) {
      try { e.setFechaVuelta(LocalDate.parse(fechaVuelta)); } catch (Exception ignored) {}
    }

    e.setDni(safeInt(d, "dni"));
    e.setIdAsiento(safeStr(d, "idAsiento"));

    e.setCreatedAt(safeInstant(d, "createdAt"));
    return e;
  }

  private String safeStr(DocumentSnapshot d, String field) {
    Object v = d.get(field);
    return v == null ? "" : String.valueOf(v);
  }

  private int safeInt(DocumentSnapshot d, String field) {
    Object v = d.get(field);
    if (v instanceof Number n) return n.intValue();
    if (v instanceof String s) { try { return Integer.parseInt(s); } catch (Exception ignored) {} }
    return 0;
  }

  private Instant safeInstant(DocumentSnapshot d, String field) {
    Object v = d.get(field);
    if (v instanceof com.google.cloud.Timestamp ts)
      return ts.toDate().toInstant();
    if (v instanceof Map<?, ?> map) {
      Object secs = map.get("seconds");
      Object nano  = map.get("nanos");
      if (secs instanceof Number n)
        return Instant.ofEpochSecond(n.longValue(),
          nano instanceof Number nn ? nn.longValue() : 0);
    }
    if (v instanceof String s && !s.isBlank()) {
      try { return Instant.parse(s); } catch (Exception ignored) {}
    }
    return Instant.EPOCH;
  }
}
