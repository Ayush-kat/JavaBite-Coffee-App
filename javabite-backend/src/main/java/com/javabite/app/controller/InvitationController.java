package com.javabite.app.controller;

import com.javabite.app.model.User;
import com.javabite.app.payload.AcceptInvitationRequest;
import com.javabite.app.payload.ApiResponse;
import com.javabite.app.payload.SendInvitationRequest;
import com.javabite.app.service.CustomUserDetails;
import com.javabite.app.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class InvitationController {

    private final InvitationService invitationService;

    /**
     * Send invitation to new staff member (ADMIN only)
     */
    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sendInvitation(
            @Valid @RequestBody SendInvitationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            User user = invitationService.sendInvitation(request, userDetails.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Invitation sent successfully to " + request.getEmail());
            response.put("user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().name(),
                    "invitationSentAt", user.getInvitationSentAt()
            ));

            log.info("✅ Admin {} sent invitation to {}", userDetails.getEmail(), request.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            log.error("❌ Failed to send invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Validate invitation token (PUBLIC - no auth required)
     */
    @GetMapping("/validate/{token}")
    public ResponseEntity<?> validateToken(@PathVariable String token) {
        try {
            User user = invitationService.validateToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().name());
            response.put("invitationSentAt", user.getInvitationSentAt());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.warn("⚠️ Invalid token validation attempt: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "valid", false,
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * Accept invitation and set password (PUBLIC - no auth required)
     */
    @PostMapping("/accept")
    public ResponseEntity<?> acceptInvitation(@Valid @RequestBody AcceptInvitationRequest request) {
        try {
            User user = invitationService.acceptInvitation(request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Invitation accepted successfully! You can now log in.");
            response.put("user", Map.of(
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole().name()
            ));

            log.info("✅ User {} accepted invitation", user.getEmail());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("❌ Failed to accept invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get all pending invitations (ADMIN only)
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingInvitations() {
        try {
            List<User> pendingInvitations = invitationService.getPendingInvitations();

            List<Map<String, Object>> formattedInvitations = pendingInvitations.stream()
                    .map(user -> {
                        Map<String, Object> inv = new HashMap<>();
                        inv.put("id", user.getId());
                        inv.put("name", user.getName());
                        inv.put("email", user.getEmail());
                        inv.put("role", user.getRole().name());
                        inv.put("invitationSentAt", user.getInvitationSentAt());
                        inv.put("status", invitationService.getInvitationStatus(user));
                        return inv;
                    })
                    .toList();

            return ResponseEntity.ok(formattedInvitations);

        } catch (Exception e) {
            log.error("❌ Failed to fetch pending invitations: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Resend invitation (ADMIN only)
     */
    @PostMapping("/{userId}/resend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resendInvitation(
            @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            User user = invitationService.resendInvitation(userId, userDetails.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Invitation resent to " + user.getEmail());

            log.info("✅ Admin {} resent invitation to {}", userDetails.getEmail(), user.getEmail());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.error("❌ Failed to resend invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Cancel invitation (ADMIN only)
     */
    @DeleteMapping("/{userId}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cancelInvitation(
            @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            invitationService.cancelInvitation(userId, userDetails.getId());

            log.info("✅ Admin {} cancelled invitation for user {}", userDetails.getEmail(), userId);

            return ResponseEntity.ok(new ApiResponse(true, "Invitation cancelled successfully"));

        } catch (RuntimeException e) {
            log.error("❌ Failed to cancel invitation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}