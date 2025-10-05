package com.harikiran.pgmgmt.security;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.harikiran.pgmgmt.model.Tenant;
import com.harikiran.pgmgmt.repository.AdminRepository;
import com.harikiran.pgmgmt.repository.TenantRepository;
import com.harikiran.pgmgmt.util.JwtUtil;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

	private final JwtUtil jwtUtil;
	private final TenantRepository tenantRepository;
	private final AdminRepository adminRepository;

	public JwtAuthenticationFilter(JwtUtil jwtUtil, TenantRepository tenantRepository,
			AdminRepository adminRepository) {
		this.jwtUtil = jwtUtil;
		this.tenantRepository = tenantRepository;
		this.adminRepository = adminRepository;
	}

	@Override
	protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {

		String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (!StringUtils.hasText(authorizationHeader) || !authorizationHeader.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		String token = authorizationHeader.substring(7);
		try {
			String email = jwtUtil.extractEmail(token);
			if (!StringUtils.hasText(email)) {
				filterChain.doFilter(request, response);
				return;
			}

			if (!jwtUtil.validateToken(token, email)) {
				filterChain.doFilter(request, response);
				return;
			}

			String role = jwtUtil.extractRole(token);
			if (!StringUtils.hasText(role)) {
				logger.debug("JWT contained no role claim for email={}", email);
				filterChain.doFilter(request, response);
				return;
			}

			if (SecurityContextHolder.getContext().getAuthentication() == null && userExists(email, role)) {
				Collection<? extends GrantedAuthority> authorities = mapAuthorities(role);
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(email,
						null, authorities);
				authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(authentication);
			}
		} catch (JwtException | IllegalArgumentException ex) {
			logger.warn("Rejected invalid JWT token: {}", ex.getMessage());
		}

		filterChain.doFilter(request, response);
	}

	private boolean userExists(String email, String role) {
		if ("admin".equalsIgnoreCase(role)) {
			return adminRepository.findByEmail(email) != null;
		}

		Optional<Tenant> tenant = tenantRepository.findByEmail(email);
		return tenant.isPresent();
	}

	private Collection<? extends GrantedAuthority> mapAuthorities(String role) {
		String normalizedRole = "ROLE_" + role.trim().toUpperCase();
		return List.of(new SimpleGrantedAuthority(normalizedRole));
	}
}
