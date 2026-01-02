package com.javabite.app.payload;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateFeedbackRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotNull(message = "Overall rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer overallRating;

    @Min(value = 1, message = "Food rating must be at least 1")
    @Max(value = 5, message = "Food rating must be at most 5")
    private Integer foodRating;

    @Min(value = 1, message = "Service rating must be at least 1")
    @Max(value = 5, message = "Service rating must be at most 5")
    private Integer serviceRating;

    @Min(value = 1, message = "Ambiance rating must be at least 1")
    @Max(value = 5, message = "Ambiance rating must be at most 5")
    private Integer ambianceRating;

    @Min(value = 1, message = "Value rating must be at least 1")
    @Max(value = 5, message = "Value rating must be at most 5")
    private Integer valueRating;

    @Size(max = 1000, message = "Comment must be less than 1000 characters")
    private String comment;

    private Boolean wouldRecommend;
}