package com.casestudy.invoiceapp.auth;

import com.casestudy.invoiceapp.user.User;
import com.casestudy.invoiceapp.user.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final SecureRandom RNG = new SecureRandom();
    private static final int SESSION_TTL_SECONDS = 60 * 60 * 8;

    private final UserRepository users;
    private final SessionRepository sessions;
    private final BCryptPasswordEncoder encoder;

    public AuthController(UserRepository users, SessionRepository sessions, BCryptPasswordEncoder encoder) {
        this.users = users;
        this.sessions = sessions;
        this.encoder = encoder;
    }

    @PostMapping("/login")
    public AuthDtos.UserResponse login(@Valid @RequestBody AuthDtos.LoginRequest body,
                                       HttpServletResponse res) {
        User user = users.findByUsername(body.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!encoder.matches(body.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        if (!"finance".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This app is finance-only");
        }

        String token = issueToken();
        sessions.save(new InvoiceSession(token, user.getId()));

        Cookie cookie = new Cookie(CurrentUserFilter.COOKIE_NAME, token);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(SESSION_TTL_SECONDS);
        res.addCookie(cookie);

        return new AuthDtos.UserResponse(user.getId(), user.getUsername(), user.getRole());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest req, HttpServletResponse res) {
        if (req.getCookies() != null) {
            for (Cookie c : req.getCookies()) {
                if (CurrentUserFilter.COOKIE_NAME.equals(c.getName())) {
                    sessions.deleteById(c.getValue());
                }
            }
        }
        Cookie cookie = new Cookie(CurrentUserFilter.COOKIE_NAME, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        res.addCookie(cookie);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public AuthDtos.UserResponse me(HttpServletRequest req) {
        User user = CurrentUserFilter.currentUser(req);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return new AuthDtos.UserResponse(user.getId(), user.getUsername(), user.getRole());
    }

    private static String issueToken() {
        byte[] buf = new byte[24];
        RNG.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
