package com.javabite.app.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used", nullable = false)
    private Boolean used = false;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Helper method to check if token is valid
    public boolean isValid() {
        return !used && LocalDateTime.now().isBefore(expiresAt);
    }

    // Helper method to check if token is expired
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}