package com.javabite.app.service;

import com.javabite.app.model.Feedback;
import com.javabite.app.model.Order;
import com.javabite.app.model.OrderStatus;
import com.javabite.app.model.User;
import com.javabite.app.payload.CreateFeedbackRequest;
import com.javabite.app.repository.FeedbackRepository;
import com.javabite.app.repository.OrderRepository;
import com.javabite.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    /**
     * Create feedback for an order
     */
    @Transactional
    public Feedback createFeedback(Long customerId, CreateFeedbackRequest request) {
        // Validate customer exists
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Validate order exists
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Validate order belongs to customer
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("This order does not belong to you");
        }

        // Validate order is completed
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new RuntimeException("You can only give feedback for completed orders");
        }

        // Check if feedback already exists
        if (feedbackRepository.existsByOrderId(request.getOrderId())) {
            throw new RuntimeException("Feedback already submitted for this order");
        }

        // Create feedback
        Feedback feedback = Feedback.builder()
                .order(order)
                .customer(customer)
                .overallRating(request.getOverallRating())
                .foodRating(request.getFoodRating())
                .serviceRating(request.getServiceRating())
                .ambianceRating(request.getAmbianceRating())
                .valueRating(request.getValueRating())
                .comment(request.getComment())
                .wouldRecommend(request.getWouldRecommend() != null ? request.getWouldRecommend() : true)
                .build();

        Feedback savedFeedback = feedbackRepository.save(feedback);
        log.info("✅ Feedback created for Order #{} by Customer {}", order.getId(), customer.getEmail());

        return savedFeedback;
    }

    /**
     * Check if customer can give feedback for order
     */
    public boolean canGiveFeedback(Long orderId, Long customerId) {
        // Check if order exists
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return false;
        }

        // Check if order belongs to customer
        if (!order.getCustomer().getId().equals(customerId)) {
            return false;
        }

        // Check if order is completed
        if (order.getStatus() != OrderStatus.COMPLETED) {
            return false;
        }

        // Check if feedback doesn't exist yet
        return !feedbackRepository.existsByOrderId(orderId);
    }

    /**
     * Get feedback for specific order
     */
    public Feedback getFeedbackByOrder(Long orderId) {
        return feedbackRepository.findByOrderId(orderId)
                .orElse(null);
    }

    /**
     * Get all feedback by customer
     */
    public List<Feedback> getCustomerFeedback(Long customerId) {
        return feedbackRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    /**
     * Get all feedback (Admin)
     */
    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get feedback by rating (Admin)
     */
    public List<Feedback> getFeedbackByRating(Integer rating) {
        return feedbackRepository.findByOverallRatingOrderByCreatedAtDesc(rating);
    }

    /**
     * Get feedback statistics (Admin)
     */
    public Map<String, Object> getFeedbackStats() {
        Map<String, Object> stats = new HashMap<>();

        // Total feedback count
        long totalFeedback = feedbackRepository.count();
        stats.put("totalFeedback", totalFeedback);

        // Average ratings
        Double avgOverall = feedbackRepository.getAverageOverallRating();
        Double avgFood = feedbackRepository.getAverageFoodRating();
        Double avgService = feedbackRepository.getAverageServiceRating();
        Double avgAmbiance = feedbackRepository.getAverageAmbianceRating();
        Double avgValue = feedbackRepository.getAverageValueRating();

        stats.put("averageOverallRating", avgOverall != null ? Math.round(avgOverall * 10.0) / 10.0 : 0.0);
        stats.put("averageFoodRating", avgFood != null ? Math.round(avgFood * 10.0) / 10.0 : 0.0);
        stats.put("averageServiceRating", avgService != null ? Math.round(avgService * 10.0) / 10.0 : 0.0);
        stats.put("averageAmbianceRating", avgAmbiance != null ? Math.round(avgAmbiance * 10.0) / 10.0 : 0.0);
        stats.put("averageValueRating", avgValue != null ? Math.round(avgValue * 10.0) / 10.0 : 0.0);

        // Rating distribution
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            Long count = feedbackRepository.countByOverallRating(i);
            ratingDistribution.put(i, count);
        }
        stats.put("ratingDistribution", ratingDistribution);

        // Recommendations
        Long wouldRecommend = feedbackRepository.countByWouldRecommend(true);
        Long wouldNotRecommend = feedbackRepository.countByWouldRecommend(false);
        stats.put("wouldRecommend", wouldRecommend != null ? wouldRecommend : 0);
        stats.put("wouldNotRecommend", wouldNotRecommend != null ? wouldNotRecommend : 0);

        // Recommendation percentage
        if (totalFeedback > 0) {
            double recommendPercentage = ((double) (wouldRecommend != null ? wouldRecommend : 0) / totalFeedback) * 100;
            stats.put("recommendationPercentage", Math.round(recommendPercentage * 10.0) / 10.0);
        } else {
            stats.put("recommendationPercentage", 0.0);
        }

        return stats;
    }

    /**
     * Delete feedback (Admin only - for moderation)
     */
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        if (!feedbackRepository.existsById(feedbackId)) {
            throw new RuntimeException("Feedback not found");
        }
        feedbackRepository.deleteById(feedbackId);
        log.info("✅ Feedback #{} deleted by admin", feedbackId);
    }
}