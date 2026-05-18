package com.casestudy.invoiceapp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Minimal context-loads test. Uses an in-memory H2 via JDBC URL override
 * so we can run without Postgres on the CI box; production env vars still
 * point at the real DB.
 */
@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class InvoiceApplicationTests {

    @Test
    void contextLoads() {
        // If the application context comes up cleanly, the wiring is sane.
    }
}
