package com.javabite.app.controller;

import com.javabite.app.payload.ApiResponse;
import com.javabite.app.payload.PasswordResetConfirmDTO;
import com.javabite.app.payload.PasswordResetRequestDTO;
import com.javabite.app.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    /**
     * Request password reset - PUBLIC endpoint
     * POST /api/auth/password-reset/request
     */
    @PostMapping("/request")
    public ResponseEntity<?> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequestDTO request,
            HttpServletRequest httpRequest) {
        try {
            Map<String, Object> response = passwordResetService.requestPasswordReset(
                    request.getEmail(),
                    httpRequest
            );

            log.info("✅ Password reset requested for: {}", request.getEmail());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("❌ Password reset request failed: {}", e.getMessage());

            // Return success message even if email doesn't exist (security best practice)
            // This prevents email enumeration attacks
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "If this email exists in our system, you will receive a reset link",
                    "email", request.getEmail(),
                    "isDemo", true
            ));
        }
    }

    /**
     * Validate reset token - PUBLIC endpoint
     * GET /api/auth/password-reset/validate/{token}
     */
    @GetMapping("/validate/{token}")
    public ResponseEntity<?> validateToken(@PathVariable String token) {
        try {
            Map<String, Object> response = passwordResetService.validateToken(token);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.warn("⚠️ Invalid token validation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "valid", false,
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * Confirm password reset - PUBLIC endpoint
     * POST /api/auth/password-reset/confirm
     */
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmDTO request) {
        try {
            Map<String, Object> response = passwordResetService.resetPassword(
                    request.getToken(),
                    request.getNewPassword(),
                    request.getConfirmPassword()
            );

            log.info("✅ Password reset successful");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("❌ Password reset failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get suspicious activity - ADMIN only
     * GET /api/auth/password-reset/admin/suspicious
     */
    @GetMapping("/admin/suspicious")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSuspiciousActivity() {
        try {
            List<Map<String, Object>> activity = passwordResetService.getSuspiciousActivity();
            return ResponseEntity.ok(activity);

        } catch (Exception e) {
            log.error("❌ Failed to get suspicious activity: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}