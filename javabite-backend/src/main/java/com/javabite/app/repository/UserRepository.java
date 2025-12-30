package com.javabite.app.repository;

import com.javabite.app.model.Role;
import com.javabite.app.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByInvitationToken(String invitationToken);

    List<User> findByRoleAndEnabled(Role role, boolean enabled);

    Long countByRoleAndEnabled(Role role, boolean enabled);
}