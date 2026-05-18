package com.casestudy.invoiceapp.auth;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<InvoiceSession, String> {
}
