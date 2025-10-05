package com.harikiran.pgmgmt.security;

import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.harikiran.pgmgmt.repository.TenantRepository;

/**
 * Helper used inside Spring Security SpEL expressions to validate whether the
 * current principal can access a given tenant resource.
 */
@Component("tenantSecurity")
public class TenantSecurity {

	private static final Logger logger = LoggerFactory.getLogger(TenantSecurity.class);

	private final TenantRepository tenantRepository;

	public TenantSecurity(TenantRepository tenantRepository) {
		this.tenantRepository = tenantRepository;
	}

	public boolean isOwnerById(String tenantId, Authentication authentication) {
		if (authentication == null || tenantId == null) {
			return false;
		}

		return tenantRepository.findById(tenantId).map(tenant -> emailMatches(authentication, tenant.getEmail()))
				.orElse(false);
	}

	public boolean isCurrentUserEmail(String email, Authentication authentication) {
		if (authentication == null || email == null) {
			return false;
		}

		return emailMatches(authentication, email);
	}

	private boolean emailMatches(Authentication authentication, String targetEmail) {
		String principalEmail = resolvePrincipalEmail(authentication);
		boolean match = principalEmail != null && targetEmail != null && Objects.equals(principalEmail, targetEmail);
		if (!match && logger.isDebugEnabled()) {
			logger.debug("Denied tenant data access principal={} target={}", principalEmail, targetEmail);
		}
		return match;
	}

	private String resolvePrincipalEmail(Authentication authentication) {
		if (authentication == null) {
			Authentication contextAuth = SecurityContextHolder.getContext().getAuthentication();
			if (contextAuth == null) {
				return null;
			}
			return resolvePrincipalEmail(contextAuth);
		}

		Object principal = authentication.getPrincipal();
		if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
			return userDetails.getUsername();
		}

		if (principal instanceof String stringPrincipal) {
			return stringPrincipal;
		}

		return null;
	}
}
