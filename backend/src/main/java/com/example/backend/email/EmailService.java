package com.example.backend.email;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

  private final JavaMailSender mailSender;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  public void enviarConfirmacionReserva(EmailConfirmacionRequest req) throws MessagingException {
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setTo(req.getTo());
    helper.setSubject("✅ Confirmación de Reserva - G7 Travel");

    String htmlContent = """
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; background: #f9f9f9; border-radius: 12px;">
                <h2 style="color: #1e88e5; text-align: center;">¡Reserva Confirmada Exitosamente!</h2>

                <p style="font-size: 16px;">Hola <strong>%s</strong>,</p>

                <div style="background: #ffffff; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 3px 10px rgba(0,0,0,0.1); text-align: center;">
                    <h3 style="color: #2e7d32; margin: 0 0 15px 0;">🎉 Reserva Confirmada</h3>
                    <h1 style="color: #1e88e5; margin: 10px 0;">%s</h1>
                    <p style="font-size: 18px; color: #333;"><strong>Fecha:</strong> %s - 07:00 AM</p>
                    <p style="font-size: 17px;"><strong>Asiento's:</strong> %s</p>
                    <p style="font-size: 16px; color: #555;">Total de asiento's: <strong>%d</strong></p>
                </div>

                <p>Gracias por elegir <strong>G7 Travel</strong>. Estamos emocionados de que vivas esta experiencia.</p>

                <hr style="margin: 30px 0;">
                <p style="font-size: 14px; color: #666; text-align: center;">
                    G7 Travel - Ayacucho, Perú<br>
                    📞 +51 966 123 456<br>
                    Cualquier duda, contáctanos.
                </p>
            </div>
            """.formatted(
      req.getNombre(),
      req.getDestino(),           // Destino más destacado
      req.getFecha(),
      req.getAsientos(),
      req.getTotalAsientos()
    );

    helper.setText(htmlContent, true);
    mailSender.send(message);
  }
}
