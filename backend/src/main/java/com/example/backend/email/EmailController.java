package com.example.backend.email;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
public class EmailController {

  private final EmailService emailService;

  public EmailController(EmailService emailService) {
    this.emailService = emailService;
  }

  @PostMapping("/confirmacion-reserva")
  public ResponseEntity<String> enviarConfirmacionReserva(@RequestBody EmailConfirmacionRequest request) {
    try {
      emailService.enviarConfirmacionReserva(request);
      return ResponseEntity.ok("Correo de confirmación enviado correctamente");
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.internalServerError()
        .body("Error al enviar el correo: " + e.getMessage());
    }
  }
}
