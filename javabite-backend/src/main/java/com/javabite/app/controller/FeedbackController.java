package com.javabite.app.controller;

import com.javabite.app.model.Feedback;
import com.javabite.app.payload.ApiResponse;
import com.javabite.app.payload.CreateFeedbackRequest;
import com.javabite.app.payload.FeedbackResponse;
import com.javabite.app.service.CustomUserDetails;
import com.javabite.app.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}, allowCredentials = "true")
public class FeedbackController {

    private final FeedbackService feedbackService;

    // ==================== CUSTOMER ENDPOINTS ====================

    /**
     * Create feedback for an order
     * POST /api/feedback
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createFeedback(
            @Valid @RequestBody CreateFeedbackRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Feedback feedback = feedbackService.createFeedback(userDetails.getId(), request);
            FeedbackResponse response = FeedbackResponse.fromEntity(feedback);

            log.info("✅ Feedback created for Order #{} by Customer {}",
                    request.getOrderId(), userDetails.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Thank you for your feedback!",
                    "data", response
            ));

        } catch (RuntimeException e) {
            log.error("❌ Failed to create feedback: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Check if customer can give feedback for order
     * GET /api/feedback/can-submit/{orderId}
     */
    @GetMapping("/can-submit/{orderId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> canGiveFeedback(
            @PathVariable Long orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            boolean canSubmit = feedbackService.canGiveFeedback(orderId, userDetails.getId());

            return ResponseEntity.ok(Map.of(
                    "canSubmit", canSubmit,
                    "orderId", orderId
            ));

        } catch (Exception e) {
            log.error("❌ Failed to check feedback eligibility: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get feedback for specific order
     * GET /api/feedback/order/{orderId}
     */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> getFeedbackByOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Feedback feedback = feedbackService.getFeedbackByOrder(orderId);

            if (feedback == null) {
                return ResponseEntity.ok(Map.of(
                        "exists", false,
                        "orderId", orderId
                ));
            }

            // Check authorization (customer can only see their own feedback)
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin && !feedback.getCustomer().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse(false, "Access denied"));
            }

            FeedbackResponse response = FeedbackResponse.fromEntity(feedback);

            return ResponseEntity.ok(Map.of(
                    "exists", true,
                    "data", response
            ));

        } catch (Exception e) {
            log.error("❌ Failed to get feedback: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get all feedback by logged-in customer
     * GET /api/feedback/my-feedback
     */
    @GetMapping("/my-feedback")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyFeedback(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            List<Feedback> feedbacks = feedbackService.getCustomerFeedback(userDetails.getId());
            List<FeedbackResponse> responses = feedbacks.stream()
                    .map(FeedbackResponse::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            log.error("❌ Failed to get customer feedback: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all feedback (Admin)
     * GET /api/feedback/admin/all
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllFeedback() {
        try {
            List<Feedback> feedbacks = feedbackService.getAllFeedback();
            List<FeedbackResponse> responses = feedbacks.stream()
                    .map(FeedbackResponse::fromEntity)
                    .collect(Collectors.toList());

            log.info("✅ Retrieved {} feedbacks", feedbacks.size());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            log.error("❌ Failed to get all feedback: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get feedback by rating (Admin)
     * GET /api/feedback/admin/rating/{rating}
     */
    @GetMapping("/admin/rating/{rating}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getFeedbackByRating(@PathVariable Integer rating) {
        try {
            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Rating must be between 1 and 5"));
            }

            List<Feedback> feedbacks = feedbackService.getFeedbackByRating(rating);
            List<FeedbackResponse> responses = feedbacks.stream()
                    .map(FeedbackResponse::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            log.error("❌ Failed to get feedback by rating: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Get feedback statistics (Admin)
     * GET /api/feedback/admin/stats
     */
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getFeedbackStats() {
        try {
            Map<String, Object> stats = feedbackService.getFeedbackStats();
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("❌ Failed to get feedback stats: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Delete feedback (Admin - for moderation)
     * DELETE /api/feedback/admin/{feedbackId}
     */
    @DeleteMapping("/admin/{feedbackId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long feedbackId) {
        try {
            feedbackService.deleteFeedback(feedbackId);
            log.info("✅ Feedback #{} deleted", feedbackId);

            return ResponseEntity.ok(new ApiResponse(true, "Feedback deleted successfully"));

        } catch (RuntimeException e) {
            log.error("❌ Failed to delete feedback: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}