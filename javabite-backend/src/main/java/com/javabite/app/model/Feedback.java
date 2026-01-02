package com.javabite.app.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "overall_rating", nullable = false)
    private Integer overallRating; // 1-5

    @Column(name = "food_rating")
    private Integer foodRating; // 1-5

    @Column(name = "service_rating")
    private Integer serviceRating; // 1-5

    @Column(name = "ambiance_rating")
    private Integer ambianceRating; // 1-5

    @Column(name = "value_rating")
    private Integer valueRating; // 1-5

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "would_recommend")
    private Boolean wouldRecommend;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Helper method to get average of all detailed ratings
    public Double getAverageDetailedRating() {
        int count = 0;
        int sum = 0;

        if (foodRating != null) {
            sum += foodRating;
            count++;
        }
        if (serviceRating != null) {
            sum += serviceRating;
            count++;
        }
        if (ambianceRating != null) {
            sum += ambianceRating;
            count++;
        }
        if (valueRating != null) {
            sum += valueRating;
            count++;
        }

        return count > 0 ? (double) sum / count : null;
    }
}