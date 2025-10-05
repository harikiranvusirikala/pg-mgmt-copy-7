package com.harikiran.pgmgmt.controller;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.harikiran.pgmgmt.model.Admin;
import com.harikiran.pgmgmt.model.Tenant;
import com.harikiran.pgmgmt.repository.AdminRepository;
import com.harikiran.pgmgmt.repository.TenantRepository;
import com.harikiran.pgmgmt.util.JwtUtil;

@RestController
@RequestMapping("/auth")
/** Handles Google OAuth sign-in for tenants and admins. */
public class AuthController {

	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

	private final TenantRepository tenantRepository;
	private final AdminRepository adminRepository;
	private final JwtUtil jwtUtil;

	@Value("${google.oauth.client-id}")
	private String googleClientId;

	public AuthController(TenantRepository tenantRepository, AdminRepository adminRepository, JwtUtil jwtUtil) {
		this.tenantRepository = tenantRepository;
		this.adminRepository = adminRepository;
		this.jwtUtil = jwtUtil;
	}

	@PostMapping("/google")
	public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
		String idTokenString = request.get("idToken");

		try {
			GoogleIdToken.Payload payload = verifyGoogleToken(idTokenString);
			if (payload != null) {
				String userId = payload.getSubject();
				String email = payload.getEmail();
				String name = (String) payload.get("name");
				String pictureUrl = (String) payload.get("picture");

				logger.info("✅ Tenant login success userId={} email={}", userId, email);
				if (logger.isDebugEnabled()) {
					Boolean emailVerified = payload.getEmailVerified();
					Object locale = payload.get("locale");
					String hostedDomain = payload.getHostedDomain();
					logger.debug("📝 Tenant payload summary emailVerified={} locale={} hostedDomain={}", emailVerified,
							locale, hostedDomain);
				}

				Tenant tenant = tenantRepository.findByEmail(email).map(existing -> update(existing, name, pictureUrl))
						.orElseGet(() -> tenantRepository.save(new Tenant(name, email, pictureUrl)));

				String jwt = jwtUtil.generateToken(tenant);

				return ResponseEntity.ok(Map.of("token", jwt, "tenant", tenant));
			} else {
				logger.warn("⚠️ Tenant login failed due to invalid Google token");
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google token");
			}
		} catch (Exception e) {
			logger.error("❌ Tenant login failed", e);
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login failed: " + e.getMessage());
		}
	}

	@PostMapping("/admin/google")
	public ResponseEntity<?> adminGoogleLogin(@RequestBody Map<String, String> request) {
		String idTokenString = request.get("idToken");

		try {
			GoogleIdToken.Payload payload = verifyGoogleToken(idTokenString);
			if (payload != null) {
				String userId = payload.getSubject();
				String email = payload.getEmail();
				String name = (String) payload.get("name");
				String pictureUrl = (String) payload.get("picture");

				logger.info("✅ Admin login success userId={} email={}", userId, email);
				if (logger.isDebugEnabled()) {
					Boolean emailVerified = payload.getEmailVerified();
					Object locale = payload.get("locale");
					String hostedDomain = payload.getHostedDomain();
					logger.debug("📝 Admin payload summary emailVerified={} locale={} hostedDomain={}", emailVerified,
							locale, hostedDomain);
				}

//				Admin admin = lookupRegisteredAdmin(email);
//				if (admin == null) {
//					logger.warn("🚫 Admin login denied for unregistered email={}", email);
//					return ResponseEntity.status(HttpStatus.FORBIDDEN)
//							.body(Map.of("error", "Admin access is restricted"));
//				}
//
//				Admin refreshed = updateAdmin(admin, name, pictureUrl);

				Admin refreshed = saveOrUpdateAdmin(name, email, pictureUrl);

				String jwt = jwtUtil.generateToken(refreshed);

				return ResponseEntity.ok(Map.of("token", jwt, "admin", refreshed));
			} else {
				logger.warn("⚠️ Admin login failed due to invalid Google token");
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google token");
			}
		} catch (Exception e) {
			logger.error("❌ Admin login failed", e);
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Login failed: " + e.getMessage());
		}
	}

	private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) throws GeneralSecurityException, IOException {
		if (idTokenString == null || idTokenString.isBlank()) {
			return null;
		}

		GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(GoogleNetHttpTransport.newTrustedTransport(),
				GsonFactory.getDefaultInstance()).setAudience(Collections.singletonList(googleClientId)).build();

		GoogleIdToken idToken = verifier.verify(idTokenString);
		return idToken != null ? idToken.getPayload() : null;
	}

//	private Admin lookupRegisteredAdmin(String email) {
//		logger.debug("🔐 Verifying admin registration email={} ", email);
//		return adminRepository.findByEmail(email);
//	}

	private Admin saveOrUpdateAdmin(String name, String email, String pictureUrl) {
		logger.debug("Looking up admin for login email={} name='{}' pictureUrlPresent={}", email, name,
				pictureUrl != null);
		return adminRepository.findByEmail(email).map(existing -> updateAdmin(existing, name, pictureUrl))
				.orElseGet(() -> adminRepository.save(new Admin(name, email, pictureUrl)));
	}

	private Tenant update(Tenant tenant, String name, String pictureUrl) {
		boolean shouldPersist = false;

		if (name != null && !name.isBlank() && !Objects.equals(name, tenant.getName())) {
			tenant.setName(name);
			shouldPersist = true;
		}

		if (!Objects.equals(pictureUrl, tenant.getPictureUrl())) {
			tenant.setPictureUrl(pictureUrl);
			shouldPersist = true;
		}

		return shouldPersist ? tenantRepository.save(tenant) : tenant;
	}

	private Admin updateAdmin(Admin admin, String name, String pictureUrl) {
		boolean shouldPersist = false;

		if (name != null && !name.isBlank() && !Objects.equals(name, admin.getName())) {
			admin.setName(name);
			shouldPersist = true;
		}

		if (!Objects.equals(pictureUrl, admin.getPictureUrl())) {
			admin.setPictureUrl(pictureUrl);
			shouldPersist = true;
		}

		return shouldPersist ? adminRepository.save(admin) : admin;
	}
}
