package com.example.backend.destinos;

import static com.example.backend.firestore.FirestoreFutures.get;

import com.example.backend.firestore.FirestoreCollections;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class DestinoRepository {

  private final CollectionReference col;

  public DestinoRepository(Firestore db) {
    this.col = db.collection(FirestoreCollections.DESTINOS);
  }

  // Métodos usados por DataInitializer
  public List<DestinoEntity> findAll() {
    QuerySnapshot snap = get(col.get());
    return snap.getDocuments().stream().map(this::toEntity).toList();
  }

  public List<DestinoEntity> findAllOrderByTitle() {
    QuerySnapshot snap = get(col.orderBy("title").get());
    return snap.getDocuments().stream().map(this::toEntity).toList();
  }

  public Optional<DestinoEntity> findById(String id) {
    DocumentSnapshot doc = get(col.document(id).get());
    if (!doc.exists()) return Optional.empty();
    return Optional.of(toEntity(doc));
  }

  public DestinoEntity getOrThrow(String id) {
    return findById(id).orElseThrow(() -> new NoSuchElementException("Destino no encontrado: " + id));
  }

  public boolean existsById(String id) {
    return get(col.document(id).get()).exists();
  }

  public long count() {
    QuerySnapshot snap = get(col.limit(1).get());
    return snap.isEmpty() ? 0 : 1;
  }

  public DestinoEntity save(DestinoEntity e) {
    if (e.getId() == null || e.getId().isBlank()) {
      throw new IllegalArgumentException("id requerido");
    }
    get(col.document(e.getId()).set(toDoc(e)));
    return e;
  }

  public void deleteById(String id) {
    get(col.document(id).delete());
  }

  // ==================== Mapeo ====================
  private DestinoEntity toEntity(DocumentSnapshot d) {
    DestinoEntity e = new DestinoEntity();
    e.setId(d.getId());
    e.setLabel(string(d, "label"));
    e.setTitle(string(d, "title"));
    e.setDesc(string(d, "desc"));
    e.setName(string(d, "name"));
    e.setBg(string(d, "bg"));
    e.setThumb(string(d, "thumb"));
    e.setIdAuto(string(d, "idAuto"));
    return e;
  }

  private Map<String, Object> toDoc(DestinoEntity e) {
    Map<String, Object> map = new HashMap<>();
    map.put("label", e.getLabel());
    map.put("title", e.getTitle());
    map.put("desc", e.getDesc());
    map.put("name", e.getName());
    map.put("bg", e.getBg());
    map.put("thumb", e.getThumb() != null ? e.getThumb() : "");

    if (e.getIdAuto() != null && !e.getIdAuto().trim().isEmpty()) {
      map.put("idAuto", e.getIdAuto());
    }

    return map;
  }

  private String string(DocumentSnapshot d, String field) {
    Object v = d.get(field);
    return v == null ? "" : String.valueOf(v);
  }
}
