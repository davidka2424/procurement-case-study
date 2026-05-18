package com.casestudy.invoiceapp.user;

import jakarta.persistence.*;

/**
 * Read-only view of the shared `users` table. The PR backend owns the schema
 * and the writes (create-user, edit-user, seed-users). The Invoice backend
 * only reads from it during login.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role;  // 'employee' | 'finance'

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getRole() { return role; }
}
