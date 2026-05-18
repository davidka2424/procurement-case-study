package com.casestudy.invoiceapp.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Customises the SpringDoc-generated OpenAPI document. Declares the
 * `invoice_token` cookie as the auth scheme so Swagger UI lets the user
 * try out protected endpoints after running POST /auth/login.
 *
 * Endpoints exposed by SpringDoc:
 *   - GET /v3/api-docs        → the OpenAPI 3 JSON spec
 *   - GET /v3/api-docs.yaml   → the same spec as YAML
 *   - GET /swagger-ui.html    → interactive UI (redirects to /swagger-ui/index.html)
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI invoiceApiSpec() {
        SecurityScheme cookieAuth = new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE)
                .name("invoice_token")
                .description("Set by POST /auth/login. Sent automatically by the browser.");

        return new OpenAPI()
                .info(new Info()
                        .title("Invoice Payment API")
                        .version("0.1.0")
                        .description("Backend for the Invoice Payment app. Finance-only — every "
                                + "endpoint except /auth/login requires the invoice_token cookie."))
                .components(new Components().addSecuritySchemes("invoice_token", cookieAuth))
                .addSecurityItem(new SecurityRequirement().addList("invoice_token"));
    }
}
