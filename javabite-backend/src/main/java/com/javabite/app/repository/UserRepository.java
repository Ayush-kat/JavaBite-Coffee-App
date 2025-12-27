package com.javabite.app.repository;

import com.javabite.app.model.Role;
import com.javabite.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Long countByRoleAndEnabled(Role role, boolean enabled);

    // ADD THIS METHOD
    Optional<User> findByInvitationToken(String invitationToken);
}