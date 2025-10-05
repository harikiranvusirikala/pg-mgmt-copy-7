package com.harikiran.pgmgmt.security;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Custom authentication entry point for REST API endpoints. Returns JSON error
 * responses instead of redirecting to login page.ACTUATOR_USERNAME Skips
 * actuator endpoints to avoid interfering with Basic auth.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private static final Logger logger = LoggerFactory.getLogger(RestAuthenticationEntryPoint.class);
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) throws IOException, ServletException {

		String requestUri = request.getRequestURI();

		// Skip logging and handling for actuator endpoints - they use Basic auth
		if (requestUri.startsWith("/actuator")) {
			return;
		}

		// Skip logging for error page (prevents duplicate logs)
		if (!requestUri.equals("/error")) {
			logger.debug("🔒 Unauthorized API access attempt: {}", requestUri);
		}

		response.setStatus(HttpStatus.UNAUTHORIZED.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);

		Map<String, Object> errorDetails = new HashMap<>();
		errorDetails.put("timestamp", Instant.now().toString());
		errorDetails.put("status", HttpStatus.UNAUTHORIZED.value());
		errorDetails.put("error", HttpStatus.UNAUTHORIZED.getReasonPhrase());
		errorDetails.put("message", authException.getMessage());
		errorDetails.put("path", requestUri);

		objectMapper.writeValue(response.getOutputStream(), errorDetails);
	}
}
