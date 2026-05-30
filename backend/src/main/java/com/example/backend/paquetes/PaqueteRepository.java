package com.example.backend.paquetes;

import com.example.backend.firestore.FirestoreCollections;
import com.example.backend.firestore.FirestoreFutures;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class PaqueteRepository {
  private final Firestore db;
  public PaqueteRepository(Firestore db) { this.db = db; }

  private com.google.cloud.firestore.CollectionReference col() {
    return db.collection("paquetes");
  }

  public List<PaqueteEntity> findAll() {
    return FirestoreFutures.get(col().get()).getDocuments().stream().map(this::toEntity).toList();
  }

  public Optional<PaqueteEntity> findById(String id) {
    DocumentSnapshot doc = FirestoreFutures.get(col().document(id).get());
    return doc.exists() ? Optional.of(toEntity(doc)) : Optional.empty();
  }

  public PaqueteEntity getOrThrow(String id) {
    return findById(id).orElseThrow(() -> new java.util.NoSuchElementException("Paquete no encontrado: " + id));
  }

  public PaqueteEntity save(PaqueteEntity e) {
    Map<String, Object> data = new HashMap<>();
    data.put("titulo", e.getTitulo());
    data.put("descripcion", e.getDescripcion());
    data.put("presio", e.getPresio());
    data.put("id_paquete", e.getId_paquete());
    data.put("imagenes", e.getImagenes());
    data.put("estado", Boolean.TRUE.equals(e.getEstado()));
    FirestoreFutures.get(col().document(e.getId()).set(data));
    return e;
  }

  public void deleteById(String id) {
    FirestoreFutures.get(col().document(id).delete());
  }

  private PaqueteEntity toEntity(DocumentSnapshot d) {
    PaqueteEntity e = new PaqueteEntity();
    e.setId(d.getId());
    e.setTitulo(d.getString("titulo"));
    e.setDescripcion(d.getString("descripcion"));
    e.setPresio(d.getLong("presio"));
    e.setId_paquete(d.getString("id_paquete"));
    e.setImagenes(d.getString("imagenes"));
    Boolean estado = d.getBoolean("estado");
    e.setEstado(estado == null ? true : Boolean.TRUE.equals(estado));
    return e;
  }
}
