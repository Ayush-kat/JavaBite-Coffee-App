package com.javabite.app.payload;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetConfirmDTO {

    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;

    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
}