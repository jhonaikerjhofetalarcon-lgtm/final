package com.example.backend.users;

import java.util.Locale;

public enum UserRole {
  admin,
  conductor;

  public static UserRole fromString(String value) {
    if (value == null) return conductor;
    String clean = value.replace("\"", "").trim().toLowerCase(Locale.ROOT);
    return switch (clean) {
      case "admin", "administrador" -> admin;
      case "conductor", "driver" -> conductor;
      default -> conductor;
    };
  }
}
