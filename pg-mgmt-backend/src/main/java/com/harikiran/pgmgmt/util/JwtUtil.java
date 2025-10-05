package com.harikiran.pgmgmt.util;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.harikiran.pgmgmt.model.Admin;
import com.harikiran.pgmgmt.model.Tenant;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

	private final Key signingKey;
	private final long expirationTime;

	public JwtUtil(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms:86400000}") long expirationTime) {
		this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationTime = expirationTime;
	}

	public String generateToken(Tenant tenant) {
		return buildToken(tenant.getEmail(), tenant.getName(), tenant.getPictureUrl(), "tenant");
	}

	public String generateToken(Admin admin) {
		return buildToken(admin.getEmail(), admin.getName(), admin.getPictureUrl(), "admin");
	}

	private String buildToken(String subject, String name, String pictureUrl, String role) {
		JwtBuilder builder = Jwts.builder().setSubject(subject).setIssuedAt(new Date(System.currentTimeMillis()))
				.setExpiration(new Date(System.currentTimeMillis() + expirationTime));

		if (name != null && !name.isBlank()) {
			builder.claim("name", name);
		}

		if (pictureUrl != null && !pictureUrl.isBlank()) {
			builder.claim("pictureUrl", pictureUrl);
		}

		if (role != null && !role.isBlank()) {
			builder.claim("role", role);
		}

		return builder.signWith(signingKey, SignatureAlgorithm.HS256).compact();
	}

	public String validateToken(String token) {
		return parseClaims(token).getSubject();
	}

	public String extractEmail(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	public String extractName(String token) {
		return extractClaim(token, claims -> claims.get("name", String.class));
	}

	public String extractRole(String token) {
		return extractClaim(token, claims -> claims.get("role", String.class));
	}

	public Date extractExpiration(String token) {
		return extractClaim(token, Claims::getExpiration);
	}

	public <T> T extractClaim(String token, java.util.function.Function<Claims, T> claimsResolver) {
		final Claims claims = parseClaims(token);
		return claimsResolver.apply(claims);
	}

	private Claims parseClaims(String token) {
		return Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token).getBody();
	}

	public boolean isTokenExpired(String token) {
		return extractExpiration(token).before(new Date());
	}

	public boolean validateToken(String token, String email) {
		final String extractedEmail = extractEmail(token);
		return extractedEmail.equals(email) && !isTokenExpired(token);
	}
}