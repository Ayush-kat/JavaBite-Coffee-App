
package com.javabite.app.repository;

import com.javabite.app.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // Check if feedback exists for order
    boolean existsByOrderId(Long orderId);

    // Get feedback by order
    Optional<Feedback> findByOrderId(Long orderId);

    // Get all feedback by customer
    List<Feedback> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    // Get feedback by rating
    List<Feedback> findByOverallRatingOrderByCreatedAtDesc(Integer rating);

    // Get all feedback ordered by date
    List<Feedback> findAllByOrderByCreatedAtDesc();

    // Count by rating
    Long countByOverallRating(Integer rating);

    // Get average overall rating
    @Query("SELECT AVG(f.overallRating) FROM Feedback f")
    Double getAverageOverallRating();

    // Get average ratings for each category
    @Query("SELECT AVG(f.foodRating) FROM Feedback f WHERE f.foodRating IS NOT NULL")
    Double getAverageFoodRating();

    @Query("SELECT AVG(f.serviceRating) FROM Feedback f WHERE f.serviceRating IS NOT NULL")
    Double getAverageServiceRating();

    @Query("SELECT AVG(f.ambianceRating) FROM Feedback f WHERE f.ambianceRating IS NOT NULL")
    Double getAverageAmbianceRating();

    @Query("SELECT AVG(f.valueRating) FROM Feedback f WHERE f.valueRating IS NOT NULL")
    Double getAverageValueRating();

    // Count recommendations
    Long countByWouldRecommend(Boolean wouldRecommend);
}