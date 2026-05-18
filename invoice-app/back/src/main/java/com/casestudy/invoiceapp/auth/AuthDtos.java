package com.casestudy.invoiceapp.auth;

import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    /** Mirrors UserOut from the PR backend so the frontend can speak to either. */
    public static class UserResponse {
        public final Long id;
        public final String username;
        public final String role;

        public UserResponse(Long id, String username, String role) {
            this.id = id;
            this.username = username;
            this.role = role;
        }
    }

    private AuthDtos() {}
}
