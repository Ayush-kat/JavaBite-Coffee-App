package com.javabite.app.payload;

import com.javabite.app.model.Feedback;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {

    private Long id;
    private Long orderId;
    private Long customerId;
    private String customerName;
    private Integer overallRating;
    private Integer foodRating;
    private Integer serviceRating;
    private Integer ambianceRating;
    private Integer valueRating;
    private String comment;
    private Boolean wouldRecommend;
    private LocalDateTime createdAt;

    // Order details
    private String orderDetails;
    private Double orderTotal;

    public static FeedbackResponse fromEntity(Feedback feedback) {
        if (feedback == null) {
            return null;
        }

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .orderId(feedback.getOrder().getId())
                .customerId(feedback.getCustomer().getId())
                .customerName(feedback.getCustomer().getName())
                .overallRating(feedback.getOverallRating())
                .foodRating(feedback.getFoodRating())
                .serviceRating(feedback.getServiceRating())
                .ambianceRating(feedback.getAmbianceRating())
                .valueRating(feedback.getValueRating())
                .comment(feedback.getComment())
                .wouldRecommend(feedback.getWouldRecommend())
                .createdAt(feedback.getCreatedAt())
                .orderDetails(String.format("Order #%d - %d items",
                        feedback.getOrder().getId(),
                        feedback.getOrder().getItems() != null ? feedback.getOrder().getItems().size() : 0))
                .orderTotal(feedback.getOrder().getTotal() != null ?
                        feedback.getOrder().getTotal().doubleValue() : 0.0)
                .build();
    }
}