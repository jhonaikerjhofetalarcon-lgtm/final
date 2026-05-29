package com.example.backend.users;

public enum UserRole {
  admin,
  conductor;

  public static UserRole fromString(String value) {
    if (value == null) return conductor;
    String clean = value.replace("\"", "").trim().toUpperCase();
    try {
      return UserRole.valueOf(clean);
    } catch (IllegalArgumentException e) {
      return conductor;
    }
  }
}
