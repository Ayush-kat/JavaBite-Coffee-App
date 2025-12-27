package com.javabite.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.email.from:noreply@javabite.com}")
    private String fromEmail;

    /**
     * Send invitation email to new staff member
     */
    public void sendInvitationEmail(String toEmail, String name, String role, String token, int expiryHours) {
        try {
            String invitationLink = frontendUrl + "/accept-invite?token=" + token;

            String subject = "You're Invited to Join JavaBite Coffee - " + role + " Position";

            String body = String.format(
                    "Hello %s,\n\n" +
                            "You have been invited to join JavaBite Coffee as a %s.\n\n" +
                            "To accept this invitation and set your password, please click the link below:\n" +
                            "%s\n\n" +
                            "This invitation will expire in %d hours.\n\n" +
                            "If you did not expect this invitation, please ignore this email.\n\n" +
                            "Best regards,\n" +
                            "JavaBite Coffee Team",
                    name, role, invitationLink, expiryHours
            );

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            log.info("✅ Invitation email sent to: {}", toEmail);
            log.info("📧 Invitation link (FOR DEVELOPMENT): {}", invitationLink);

        } catch (Exception e) {
            log.error("❌ Failed to send invitation email to {}: {}", toEmail, e.getMessage());
            // Don't throw exception - log the link for development
            String invitationLink = frontendUrl + "/accept-invite?token=" + token;
            log.warn("⚠️ EMAIL SENDING FAILED - Use this link manually: {}", invitationLink);
        }
    }

    /**
     * Send password reset email (future feature)
     */
    public void sendPasswordResetEmail(String toEmail, String name, String resetToken) {
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            String subject = "JavaBite Coffee - Password Reset Request";

            String body = String.format(
                    "Hello %s,\n\n" +
                            "We received a request to reset your password.\n\n" +
                            "Click the link below to reset your password:\n" +
                            "%s\n\n" +
                            "This link will expire in 1 hour.\n\n" +
                            "If you did not request a password reset, please ignore this email.\n\n" +
                            "Best regards,\n" +
                            "JavaBite Coffee Team",
                    name, resetLink
            );

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            log.info("✅ Password reset email sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Failed to send password reset email: {}", e.getMessage());
        }
    }

    /**
     * Send welcome email after invitation acceptance
     */
    public void sendWelcomeEmail(String toEmail, String name, String role) {
        try {
            String loginLink = frontendUrl + "/login";

            String subject = "Welcome to JavaBite Coffee!";

            String body = String.format(
                    "Hello %s,\n\n" +
                            "Welcome to JavaBite Coffee! Your account as a %s has been activated.\n\n" +
                            "You can now log in using your email and the password you set:\n" +
                            "%s\n\n" +
                            "We're excited to have you on our team!\n\n" +
                            "Best regards,\n" +
                            "JavaBite Coffee Team",
                    name, role, loginLink
            );

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            log.info("✅ Welcome email sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("❌ Failed to send welcome email: {}", e.getMessage());
        }
    }
}