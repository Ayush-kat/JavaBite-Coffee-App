package com.javabite.app.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetResponseDTO {

    private boolean success;
    private String message;
    private String email;
    private String resetLink;  // For demo purposes - shows link on screen
    private String expiresAt;
    private boolean isDemo;    // Flag to indicate this is demo mode
}