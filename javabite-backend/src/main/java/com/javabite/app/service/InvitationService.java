package com.javabite.app.service;

import com.javabite.app.model.Role;
import com.javabite.app.model.User;
import com.javabite.app.payload.AcceptInvitationRequest;
import com.javabite.app.payload.SendInvitationRequest;
import com.javabite.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final int INVITATION_EXPIRY_HOURS = 48;

    /**
     * Send invitation to new staff member
     */
    @Transactional
    public User sendInvitation(SendInvitationRequest request, Long adminId) {
        // Validate email doesn't already exist
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email already exists");
        }

        // Generate unique invitation token
        String token = UUID.randomUUID().toString();

        // Validate role
        Role role;
        try {
            role = Role.valueOf(request.getRole().toUpperCase());
            if (role == Role.CUSTOMER) {
                throw new RuntimeException("Cannot invite customers through staff invitation");
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + request.getRole());
        }

        // Set capacity based on role
        int maxActiveOrders;
        switch (role) {
            case ADMIN:
                maxActiveOrders = 999;
                break;
            case CHEF:
                maxActiveOrders = 10;
                break;
            case WAITER:
                maxActiveOrders = 1;
                break;
            default:
                maxActiveOrders = 5;
        }

        // Create user with invitation token (disabled until acceptance)
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Temporary password
                .role(role)
                .enabled(false) // ✅ CRITICAL: Disabled until invitation accepted
                .maxActiveOrders(maxActiveOrders)
                .currentActiveOrders(0)
                .isAvailable(true)
                .invitationToken(token)
                .invitationSentAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // Send invitation email
        emailService.sendInvitationEmail(
                request.getEmail(),
                request.getName(),
                role.name(),
                token,
                INVITATION_EXPIRY_HOURS
        );

        log.info("✅ Invitation sent to {} ({}) - Token: {}", request.getEmail(), role, token);

        return savedUser;
    }

    /**
     * Validate invitation token
     */
    public User validateToken(String token) {
        User user = userRepository.findByInvitationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        // Check if already accepted
        if (user.getInvitationAcceptedAt() != null) {
            throw new RuntimeException("This invitation has already been accepted");
        }

        // Check if expired (48 hours)
        LocalDateTime expiryTime = user.getInvitationSentAt().plusHours(INVITATION_EXPIRY_HOURS);
        if (LocalDateTime.now().isAfter(expiryTime)) {
            throw new RuntimeException("This invitation has expired");
        }

        return user;
    }

    /**
     * Accept invitation and set password
     */
    @Transactional
    public User acceptInvitation(AcceptInvitationRequest request) {
        // Validate token
        User user = validateToken(request.getToken());

        // Validate password
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        // Set password (BCrypt hashed) and enable account
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEnabled(true);
        user.setInvitationAcceptedAt(LocalDateTime.now());
        user.setInvitationToken(null); // Clear token after use

        User savedUser = userRepository.save(user);

        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getName(), user.getRole().name());

        log.info("✅ Invitation accepted by {} - Account activated", user.getEmail());

        return savedUser;
    }

    /**
     * Get all pending invitations (admin view)
     */
    public List<User> getPendingInvitations() {
        return userRepository.findAll().stream()
                .filter(u -> u.getInvitationToken() != null && u.getInvitationAcceptedAt() == null)
                .sorted((a, b) -> b.getInvitationSentAt().compareTo(a.getInvitationSentAt()))
                .collect(Collectors.toList());
    }

    /**
     * Get invitation status
     */
    public String getInvitationStatus(User user) {
        if (user.getInvitationAcceptedAt() != null) {
            return "ACCEPTED";
        }

        if (user.getInvitationToken() == null) {
            return "NO_INVITATION";
        }

        LocalDateTime expiryTime = user.getInvitationSentAt().plusHours(INVITATION_EXPIRY_HOURS);
        if (LocalDateTime.now().isAfter(expiryTime)) {
            return "EXPIRED";
        }

        return "PENDING";
    }

    /**
     * Resend invitation (if expired or failed)
     */
    @Transactional
    public User resendInvitation(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getInvitationAcceptedAt() != null) {
            throw new RuntimeException("User has already accepted invitation");
        }

        // Generate new token
        String newToken = UUID.randomUUID().toString();
        user.setInvitationToken(newToken);
        user.setInvitationSentAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Send new invitation email
        emailService.sendInvitationEmail(
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                newToken,
                INVITATION_EXPIRY_HOURS
        );

        log.info("✅ Invitation resent to {} - New token: {}", user.getEmail(), newToken);

        return savedUser;
    }

    /**
     * Cancel pending invitation
     */
    @Transactional
    public void cancelInvitation(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getInvitationAcceptedAt() != null) {
            throw new RuntimeException("Cannot cancel accepted invitation");
        }

        // Delete user if invitation not accepted
        userRepository.delete(user);

        log.info("✅ Invitation cancelled and user deleted: {}", user.getEmail());
    }
}