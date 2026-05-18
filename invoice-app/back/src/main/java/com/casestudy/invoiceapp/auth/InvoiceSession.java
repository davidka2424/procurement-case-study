package com.casestudy.invoiceapp.auth;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Opaque-token session. Lives in its own table (`invoice_sessions`) — the PR
 * app has `pr_sessions`. Users are shared, sessions are not.
 */
@Entity
@Table(name = "invoice_sessions")
public class InvoiceSession {

    @Id
    private String token;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public InvoiceSession() {
    }

    public InvoiceSession(String token, Long userId) {
        this.token = token;
        this.userId = userId;
    }

    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public Instant getCreatedAt() { return createdAt; }
}
