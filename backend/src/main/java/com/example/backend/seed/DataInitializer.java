package com.example.backend.seed;

import com.example.backend.destinos.DestinoEntity;
import com.example.backend.destinos.DestinoRepository;
import com.example.backend.paquetes.PaqueteEntity;
import com.example.backend.paquetes.PaqueteRepository;
import com.example.backend.tours.TourEntity;
import com.example.backend.tours.TourRepository;
import com.example.backend.users.UserEntity;
import com.example.backend.users.UserRepository;
import com.example.backend.users.UserRole;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

  private static final String IMG_AYACUCHO = "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg";

  private final UserRepository userRepo;
  private final DestinoRepository destinoRepo;
  private final TourRepository tourRepo;
  private final PaqueteRepository paqueteRepo;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

  public DataInitializer(
      UserRepository userRepo,
      DestinoRepository destinoRepo,
      TourRepository tourRepo,
      PaqueteRepository paqueteRepo) {
    this.userRepo = userRepo;
    this.destinoRepo = destinoRepo;
    this.tourRepo = tourRepo;
    this.paqueteRepo = paqueteRepo;
  }

  @Override
  public void run(String... args) {
    seedUsers();
    seedDestinos();
    seedPaquetes();
    seedTours();
  }

  private void seedUsers() {
    if (userRepo.count() > 0) return;
    for (UserEntity u : List.of(
        user("Carlos Quispe", "carlos@g7travel.com", "987 654 321", UserRole.admin, "admin1"),
        user("Maria Huaman", "maria@g7travel.com", "976 543 210", UserRole.conductor, "pass01"),
        user("Luis Flores", "luis@g7travel.com", "965 432 109", UserRole.conductor, "pass02"),
        user("Ana Torres", "ana@g7travel.com", "954 321 098", UserRole.conductor, "pass03"),
        user("Pedro Mendoza", "pedro@g7travel.com", "943 210 987", UserRole.admin, "admin2"))) {
      userRepo.save(u);
    }
  }

  private UserEntity user(String nombre, String email, String telefono, UserRole rol, String password) {
    UserEntity e = new UserEntity();
    e.setId(UUID.randomUUID().toString());
    e.setNombre(nombre);
    e.setEmail(email);
    e.setTelefono(telefono);
    e.setRol(rol);
    e.setPasswordHash(encoder.encode(password));
    return e;
  }

  private void seedDestinos() {
    for (DestinoEntity d : List.of(
        destino("Historico", "Pampa de Quinua",
            "Ubicada cerca de Ayacucho, paisaje andino de gran valor historico y natural.",
            "Historia viva", "https://www.ytuqueplanes.com/imagenes/fotos/novedades/sierra-pampa-quinua.JPG"),
        destino("Mistica", "Machu Picchu",
            "Antigua ciudad inca rodeada de montanas. Una de las maravillas del mundo.",
            "Maravilla", "https://images.pexels.com/photos/259967/pexels-photo-259967.jpeg"),
        destino("Historico", "Cusco",
            "Ciudad andina llena de historia, antigua capital del Imperio Inca.",
            "Milenario", "https://images.pexels.com/photos/21014/pexels-photo.jpg"),
        destino("Mistico", "Lago Titicaca",
            "El lago navegable mas alto del mundo, rodeado de tradiciones ancestrales.",
            "Sagrado", "https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg"),
        destino("Tradicional", "Sarhua",
            "Pueblo andino conocido por su arte tradicional y las tablas de Sarhua.",
            "Cultural", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4qHUBk0VGAdXrmJiwT98ksH9f9KWWm7Sicw&s"),
        destino("Full Day", "Aguas Turquesas de Millpu",
            "Full Day: S/. 110.00 por persona. Caminata panoramica y visita a las piscinas naturales de Millpu.",
            "Desde S/. 110", "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg"),
        destino("Half Day", "Ayacucho City Tours",
            "Half Day: S/. 50.00 por persona. Recorrido urbano por templos, plazas, miradores y casonas historicas.",
            "Desde S/. 50", "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg"),
        destino("Full Day", "Pikimachay - Huanta",
            "Full Day: S/. 70.00 por persona. Visita a Pikimachay, Huanta y atractivos cercanos.",
            "Desde S/. 70", "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg"),
        destino("Full Day", "Vilcashuaman",
            "Full Day: S/. 90.00 por persona. Ruta arqueologica hacia Vilcashuaman y el templo del Sol y la Luna.",
            "Desde S/. 90", "https://images.pexels.com/photos/2929906/pexels-photo-2929906.jpeg"),
        destino("Half Day", "Tour a Pampa de Ayacucho",
            "Half Day: S/. 65.00 por persona. Visita a la Pampa de Ayacucho y el pueblo artesanal de Quinua.",
            "Desde S/. 65", "https://www.ytuqueplanes.com/imagenes/fotos/novedades/sierra-pampa-quinua.JPG"),
        destino("Full Day", "Ruta de Cataratas",
            "Full Day: S/. 90.00 por persona. Recorrido natural por cataratas y paisajes andinos.",
            "Desde S/. 90", "https://images.pexels.com/photos/949194/pexels-photo-949194.jpeg"),
        destino("Full Day", "Cascadas de Sarhua",
            "Full Day: S/. 180.00 por persona. Ruta hacia Sarhua, cascadas y expresiones de arte tradicional.",
            "Desde S/. 180", IMG_AYACUCHO),
        destino("Full Day", "Volcan de Pachapupum",
            "Full Day: S/. 150.00 por persona. Excursion al volcan de Pachapupum y aguas termales naturales.",
            "Desde S/. 150", "https://images.pexels.com/photos/302769/pexels-photo-302769.jpeg"),
        destino("Full Day", "Huatuscalla Huanta",
            "Full Day: S/. 70.00 por persona. Experiencia natural y cultural por Huatuscalla y Huanta.",
            "Desde S/. 70", "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg"),
        destino("Full Day", "Laguna Esmeralda Verdeccocha",
            "Full Day: S/. 250.00 por persona. Ruta de aventura hacia la laguna Esmeralda Verdeccocha.",
            "Desde S/. 250", "https://images.pexels.com/photos/355321/pexels-photo-355321.jpeg"))) {
      saveDestinoIfMissing(d);
    }
  }

  private DestinoEntity destino(String label, String title, String desc, String name, String imageUrl) {
    DestinoEntity d = new DestinoEntity();
    d.setId(UUID.randomUUID().toString());
    d.setLabel(label);
    d.setTitle(title);
    d.setDesc(desc);
    d.setName(name);
    d.setBg(imageUrl);
    d.setThumb(imageUrl);
    return d;
  }

  private void saveDestinoIfMissing(DestinoEntity destino) {
    boolean exists = destinoRepo.findAll().stream()
        .anyMatch(d -> d.getTitle() != null && d.getTitle().equalsIgnoreCase(destino.getTitle()));
    if (!exists) destinoRepo.save(destino);
  }

  private void seedPaquetes() {
    for (PaqueteEntity p : List.of(
        paquete("Carnaval Ayacucho 2027", "5d/4n. Precio desde S/. 605.00. Programa especial para carnavales con alojamiento, tours y asistencia durante el viaje.", 605L, "5D/4N"),
        paquete("Semana Santa Ayacucho 2027", "4d/3n. Precio desde S/. 645.00. Experiencia religiosa y cultural por templos, procesiones y atractivos clasicos de Ayacucho.", 645L, "4D/3N"),
        paquete("Fiestas Patrias Ayacucho 2026", "4d/3n. Precio desde S/. 520.00. Paquete de feriado largo con city tour, rutas historicas y asistencia local.", 520L, "4D/3N"),
        paquete("Ayacucho Magico", "6d/5n. Precio desde S/. 785.00. Itinerario completo con atractivos naturales, culturales e historicos.", 785L, "6D/5N"),
        paquete("Ayacucho Turismo Completo", "5d/4n. Precio desde S/. 571.00. Programa integral para conocer los principales atractivos de Ayacucho.", 571L, "5D/4N"),
        paquete("Ayacucho Ecoaventura", "4d/3n. Precio desde S/. 444.00. Naturaleza, caminatas y rutas de aventura en los alrededores de Ayacucho.", 444L, "4D/3N"),
        paquete("Ayacucho Historico", "4d/3n. Precio desde S/. 405.00. Ruta historica por templos, casonas, Quinua y Pampa de Ayacucho.", 405L, "4D/3N"),
        paquete("Ayacucho Aguas Turquesas", "3d/2n. Precio desde S/. 446.00. Incluye experiencia hacia las aguas turquesas y recorridos complementarios.", 446L, "3D/2N"),
        paquete("Ayacucho Tradicional", "3d/2n. Precio desde S/. 374.00. Cultura viva, artesania, gastronomia y principales atractivos urbanos.", 374L, "3D/2N"),
        paquete("Ayacucho Ecoturismo", "3d/2n. Precio desde S/. 345.00. Experiencia natural con paisajes andinos y rutas de bajo impacto.", 345L, "3D/2N"),
        paquete("Ayacucho Joya Oculta", "3d/2n. Precio desde S/. 314.00. Ruta alternativa para conocer atractivos menos explorados.", 314L, "3D/2N"),
        paquete("Ayacucho Millpu", "2d/1n. Precio desde S/. 267.00. Paquete corto hacia Millpu con asistencia y servicios basicos.", 267L, "2D/1N"),
        paquete("Aguas Termales Colpa", "Costo por persona desde S/. 80.00. Minimo de participantes sujeto a confirmacion.", 80L, "TOUR"),
        paquete("Tour a Uchillki", "Costo por persona desde S/. 150.00. Promocion desde S/. 120.00 segun grupo y disponibilidad.", 120L, "TOUR"),
        paquete("Tour a Cenote de Chapalla", "Costo por persona desde S/. 120.00. Promocion desde S/. 100.00 segun grupo y disponibilidad.", 100L, "TOUR"),
        paquete("Cascadas de Ruqruqa", "Tarifa nacional desde S/. 90.00. Minimo de participantes sujeto a confirmacion.", 90L, "TOUR"),
        paquete("Tour Intiwarkuna", "Precio desde S/. 70.00. Promocion desde S/. 50.00 para grupos.", 50L, "TOUR"),
        paquete("Tour a Puncupata", "Tarifa nacional desde S/. 90.00. Minimo de participantes sujeto a confirmacion.", 90L, "TOUR"),
        paquete("Tour a Ritipata", "Tarifa normal desde S/. 130.00. Minimo de participantes sujeto a confirmacion.", 130L, "TOUR"))) {
      savePaqueteIfMissing(p);
    }
  }

  private PaqueteEntity paquete(String titulo, String descripcion, Long precio, String codigo) {
    PaqueteEntity p = new PaqueteEntity();
    p.setId(UUID.randomUUID().toString());
    p.setTitulo(titulo);
    p.setDescripcion(descripcion);
    p.setPresio(precio);
    p.setId_paquete(codigo);
    p.setImagenes(IMG_AYACUCHO);
    p.setEstado(true);
    return p;
  }

  private void savePaqueteIfMissing(PaqueteEntity paquete) {
    boolean exists = paqueteRepo.findAll().stream()
        .anyMatch(p -> p.getTitulo() != null && p.getTitulo().equalsIgnoreCase(paquete.getTitulo()));
    if (!exists) paqueteRepo.save(paquete);
  }

  private void seedTours() {
    if (tourRepo.count() > 0) return;
    List<DestinoEntity> destinos = destinoRepo.findAll();
    if (destinos.isEmpty()) return;

    String idMachu = idDestino(destinos, "Machu");
    String idCusco = idDestino(destinos, "Cusco");
    String idTiti = idDestino(destinos, "Titicaca");
    String idAyacu = idDestino(destinos, "Quinua");

    for (TourEntity t : List.of(
        tour("Machu Picchu Clasico", "Visita la ciudadela inca mas famosa del mundo con guia especializado.",
            idMachu, 450.0, 3, 20, "moderado", "Transporte, hotel 2 noches, guia, entrada", "Comidas, vuelos",
            "https://images.pexels.com/photos/259967/pexels-photo-259967.jpeg"),
        tour("Cusco Imperial", "Recorre el Qorikancha, Sacsayhuaman y el mercado de San Pedro.",
            idCusco, 320.0, 2, 15, "facil", "Transporte, hotel 1 noche, guia, entradas", "Comidas, souvenirs",
            "https://images.pexels.com/photos/21014/pexels-photo.jpg"),
        tour("Lago Titicaca Ancestral", "Navega por el lago mas alto del mundo y visita las islas flotantes.",
            idTiti, 380.0, 2, 12, "facil", "Transporte, bote, hotel, guia", "Comidas personales",
            "https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg"),
        tour("Ayacucho Historia Viva", "Descubre la Pampa de Quinua, escenario de la Batalla de Ayacucho.",
            idAyacu, 250.0, 1, 25, "facil", "Transporte, guia local, almuerzo tipico", "Gastos personales",
            "https://www.ytuqueplanes.com/imagenes/fotos/novedades/sierra-pampa-quinua.JPG"))) {
      tourRepo.save(t);
    }
  }

  private String idDestino(List<DestinoEntity> destinos, String titlePart) {
    return destinos.stream()
        .filter(d -> d.getTitle() != null && d.getTitle().contains(titlePart))
        .map(DestinoEntity::getId)
        .findFirst()
        .orElse(destinos.get(0).getId());
  }

  private TourEntity tour(String nombre, String desc, String destinoId,
                          double precio, int dias, int cupos,
                          String dificultad, String incluye, String noIncluye, String imagenUrl) {
    TourEntity t = new TourEntity();
    t.setId(UUID.randomUUID().toString());
    t.setNombre(nombre);
    t.setDescripcion(desc);
    t.setDestinoId(destinoId);
    t.setPrecio(precio);
    t.setDuracionDias(dias);
    t.setCuposTotal(cupos);
    t.setCuposDisponibles(cupos);
    t.setDificultad(dificultad);
    t.setIncluye(incluye);
    t.setNoIncluye(noIncluye);
    t.setImagenUrl(imagenUrl);
    t.setActivo(true);
    t.setCreadoEn(Instant.now());
    return t;
  }
}
