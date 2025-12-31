package com.javabite.app.repository;

import com.javabite.app.model.PasswordResetToken;
import com.javabite.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordResetToken, Long> {

    // Find by token
    Optional<PasswordResetToken> findByToken(String token);

    // Find by user (get all tokens for a user)
    List<PasswordResetToken> findByUser(User user);

    // Find valid tokens for user (not used, not expired)
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user " +
            "AND t.used = false AND t.expiresAt > :now")
    List<PasswordResetToken> findValidTokensByUser(
            @Param("user") User user,
            @Param("now") LocalDateTime now
    );

    // Count recent requests by user (for rate limiting)
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.user = :user " +
            "AND t.createdAt > :since")
    Long countRecentRequestsByUser(
            @Param("user") User user,
            @Param("since") LocalDateTime since
    );

    // Count recent requests by IP (for rate limiting)
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.ipAddress = :ip " +
            "AND t.createdAt > :since")
    Long countRecentRequestsByIp(
            @Param("ip") String ip,
            @Param("since") LocalDateTime since
    );

    // Delete expired tokens (cleanup)
    void deleteByExpiresAtBefore(LocalDateTime dateTime);

    // Find suspicious activity (many requests)
    @Query("SELECT t.user.email, COUNT(t) as count FROM PasswordResetToken t " +
            "WHERE t.createdAt > :since GROUP BY t.user.email " +
            "HAVING COUNT(t) >= :threshold")
    List<Object[]> findSuspiciousActivity(
            @Param("since") LocalDateTime since,
            @Param("threshold") Long threshold
    );
}
