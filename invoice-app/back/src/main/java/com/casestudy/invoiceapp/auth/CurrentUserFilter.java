package com.casestudy.invoiceapp.auth;

import com.casestudy.invoiceapp.user.User;
import com.casestudy.invoiceapp.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

/**
 * Resolves the current user from the {@code invoice_token} cookie on every
 * request, and stuffs the User into a request attribute so controllers can
 * read it via {@link #currentUser(HttpServletRequest)}.
 *
 * <p>This filter never blocks the request — endpoint-level authorisation is
 * the controller's job (a missing user yields 401, a wrong role yields 403).
 */
@Component
public class CurrentUserFilter extends OncePerRequestFilter {

    public static final String COOKIE_NAME = "invoice_token";
    public static final String CURRENT_USER_ATTR = "currentUser";

    private final SessionRepository sessions;
    private final UserRepository users;

    public CurrentUserFilter(SessionRepository sessions, UserRepository users) {
        this.sessions = sessions;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            Optional<String> token = Arrays.stream(cookies)
                    .filter(c -> COOKIE_NAME.equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst();
            token.flatMap(sessions::findById)
                    .flatMap(s -> users.findById(s.getUserId()))
                    .ifPresent(u -> req.setAttribute(CURRENT_USER_ATTR, u));
        }
        chain.doFilter(req, res);
    }

    public static User currentUser(HttpServletRequest req) {
        return (User) req.getAttribute(CURRENT_USER_ATTR);
    }
}
