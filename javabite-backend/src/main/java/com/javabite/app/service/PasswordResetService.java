package com.javabite.app.service;

import com.javabite.app.model.PasswordResetToken;
import com.javabite.app.model.User;
import com.javabite.app.repository.PasswordResetRepository;
import com.javabite.app.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final PasswordResetRepository resetRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final int TOKEN_EXPIRY_HOURS = 1;
    private static final int MAX_REQUESTS_PER_HOUR = 3;
    private static final int MAX_REQUESTS_PER_IP_PER_HOUR = 10;
    private static final int SUSPICIOUS_THRESHOLD = 10;

    /**
     * Request password reset - generates token and "sends" reset link
     */
    @Transactional
    public Map<String, Object> requestPasswordReset(String email, HttpServletRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("If this email exists in our system, you will receive a reset link"));

        // Check if user is enabled
        if (!user.isEnabled()) {
            throw new RuntimeException("Account is disabled. Please contact support.");
        }

        // Get IP address
        String ipAddress = getClientIp(request);

        // Rate limiting - check user requests
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        Long userRequestCount = resetRepository.countRecentRequestsByUser(user, oneHourAgo);

        if (userRequestCount >= MAX_REQUESTS_PER_HOUR) {
            throw new RuntimeException("Too many reset requests. Please try again later.");
        }

        // Rate limiting - check IP requests
        Long ipRequestCount = resetRepository.countRecentRequestsByIp(ipAddress, oneHourAgo);

        if (ipRequestCount >= MAX_REQUESTS_PER_IP_PER_HOUR) {
            throw new RuntimeException("Too many requests from this location. Please try again later.");
        }

        // Invalidate any existing valid tokens for this user
        List<PasswordResetToken> existingTokens = resetRepository.findValidTokensByUser(user, LocalDateTime.now());
        existingTokens.forEach(token -> {
            token.setUsed(true);
            token.setUsedAt(LocalDateTime.now());
        });
        if (!existingTokens.isEmpty()) {
            resetRepository.saveAll(existingTokens);
        }

        // Generate new token
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS);

        // Create reset token
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .used(false)
                .ipAddress(ipAddress)
                .build();

        resetRepository.save(resetToken);

        // ✅ FOR DEMO: Generate reset link to display on screen
        // In production, this would be sent via email
        String resetLink = String.format("http://localhost:3000/reset-password/confirm?token=%s", token);

        log.info("✅ Password reset requested for user: {}", email);
        log.info("🔗 Reset link (DEMO): {}", resetLink);

        return Map.of(
                "success", true,
                "message", "Password reset link generated successfully",
                "email", email,
                "resetLink", resetLink,
                "expiresAt", expiresAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                "isDemo", true
        );
    }

    /**
     * Validate reset token
     */
    public Map<String, Object> validateToken(String token) {
        PasswordResetToken resetToken = resetRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.getUsed()) {
            throw new RuntimeException("This reset link has already been used");
        }

        if (resetToken.isExpired()) {
            throw new RuntimeException("This reset link has expired. Please request a new one.");
        }

        return Map.of(
                "valid", true,
                "email", resetToken.getUser().getEmail(),
                "expiresAt", resetToken.getExpiresAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );
    }

    /**
     * Reset password using token
     */
    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword, String confirmPassword) {
        // Validate passwords match
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("Passwords do not match");
        }

        // Validate password strength
        if (newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long");
        }

        // Find and validate token
        PasswordResetToken resetToken = resetRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (resetToken.getUsed()) {
            throw new RuntimeException("This reset link has already been used");
        }

        if (resetToken.isExpired()) {
            throw new RuntimeException("This reset link has expired. Please request a new one.");
        }

        // Update user password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        resetToken.setUsedAt(LocalDateTime.now());
        resetRepository.save(resetToken);

        log.info("✅ Password reset successfully for user: {}", user.getEmail());

        return Map.of(
                "success", true,
                "message", "Password reset successfully! You can now login with your new password.",
                "email", user.getEmail()
        );
    }

    /**
     * Get suspicious activity for admin monitoring
     */
    public List<Map<String, Object>> getSuspiciousActivity() {
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        List<Object[]> results = resetRepository.findSuspiciousActivity(oneDayAgo, (long) SUSPICIOUS_THRESHOLD);

        return results.stream()
                .map(result -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("email", (String) result[0]);
                    map.put("requestCount", ((Number) result[1]).longValue());
                    map.put("status", "⚠️ Suspicious");
                    return map;
                })
                .collect(Collectors.toList());  // ✅ Changed from .toList()
    }
    /**
     * Cleanup expired tokens (scheduled task)
     */
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        resetRepository.deleteByExpiresAtBefore(now);
        log.info("🧹 Cleaned up expired password reset tokens");
    }

    /**
     * Get client IP address from request
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip : "unknown";
    }
}