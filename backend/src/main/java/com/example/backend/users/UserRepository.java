package com.example.backend.users;

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
public class UserRepository {

  private final CollectionReference col;

  public UserRepository(Firestore db) {
    this.col = db.collection(FirestoreCollections.USERS);
  }

  public List<UserEntity> findAllOrderByNombre() {
    QuerySnapshot snap = get(col.orderBy("nombre").get());
    return snap.getDocuments().stream().map(this::toEntity).toList();
  }

  public Optional<UserEntity> findById(String id) {
    DocumentSnapshot doc = get(col.document(id).get());
    if (!doc.exists()) return Optional.empty();
    return Optional.of(toEntity(doc));
  }

  public boolean existsById(String id) {
    return get(col.document(id).get()).exists();
  }

  public Optional<UserEntity> findByEmailIgnoreCase(String email) {
    QuerySnapshot snap = get(col.whereEqualTo("emailLower", email.toLowerCase()).limit(1).get());
    if (snap.isEmpty()) return Optional.empty();
    return Optional.of(toEntity(snap.getDocuments().get(0)));
  }

  public boolean existsByEmailIgnoreCase(String email) {
    return findByEmailIgnoreCase(email).isPresent();
  }

  public UserEntity save(UserEntity e) {
    if (e.getId() == null || e.getId().isBlank())
      throw new IllegalArgumentException("id requerido");
    get(col.document(e.getId()).set(toDoc(e)));
    return e;
  }

  public void deleteById(String id) {
    get(col.document(id).delete());
  }

  // Método que faltaba (usado en DataInitializer)
  public long count() {
    QuerySnapshot snap = get(col.limit(1).get());
    return snap.isEmpty() ? 0 : snap.size();
  }

  public UserEntity getOrThrow(String id) {
    return findById(id).orElseThrow(() -> new NoSuchElementException("Usuario no encontrado"));
  }

  private UserEntity toEntity(DocumentSnapshot d) {
    UserEntity e = new UserEntity();
    e.setId(d.getId());
    e.setNombre(string(d, "nombre"));
    e.setEmail(string(d, "email"));
    e.setTelefono(string(d, "telefono"));

    String rol = string(d, "rol");
    e.setRol(UserRole.fromString(rol));

    e.setPasswordHash(string(d, "passwordHash"));

    // Campos para Conductor
    e.setLicencia(string(d, "licencia"));
    e.setTipoLicencia(string(d, "tipoLicencia"));
    e.setFechaVencimientoLicencia(string(d, "fechaVencimientoLicencia"));
    e.setExperienciaAnios(integer(d, "experienciaAnios"));
    e.setTipoVehiculo(string(d, "tipoVehiculo"));

    return e;
  }

  private Map<String, Object> toDoc(UserEntity e) {
    Map<String, Object> map = new HashMap<>();
    map.put("nombre", e.getNombre());
    map.put("email", e.getEmail());
    map.put("emailLower", e.getEmail().toLowerCase());
    map.put("telefono", e.getTelefono());
    map.put("rol", e.getRol().name());

    if (e.getPasswordHash() != null)
      map.put("passwordHash", e.getPasswordHash());

    // Campos para Conductor
    if (e.getLicencia() != null) map.put("licencia", e.getLicencia());
    if (e.getTipoLicencia() != null) map.put("tipoLicencia", e.getTipoLicencia());
    if (e.getFechaVencimientoLicencia() != null) map.put("fechaVencimientoLicencia", e.getFechaVencimientoLicencia());
    if (e.getExperienciaAnios() != null) map.put("experienciaAnios", e.getExperienciaAnios());
    if (e.getTipoVehiculo() != null) map.put("tipoVehiculo", e.getTipoVehiculo());

    return map;
  }

  private String string(DocumentSnapshot d, String field) {
    Object v = d.get(field);
    return v == null ? "" : String.valueOf(v);
  }

  private Integer integer(DocumentSnapshot d, String field) {
    Object v = d.get(field);
    return v == null ? null : Integer.valueOf(v.toString());
  }
}
