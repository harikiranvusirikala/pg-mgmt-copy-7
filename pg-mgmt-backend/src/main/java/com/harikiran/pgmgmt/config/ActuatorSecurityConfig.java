package com.harikiran.pgmgmt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for Spring Boot Actuator endpoints. Separates actuator
 * auth from main application JWT auth.
 */
@Configuration
@EnableWebSecurity
public class ActuatorSecurityConfig {

	@Value("${spring.security.user.name}")
	private String actuatorUsername;

	@Value("${spring.security.user.password}")
	private String actuatorPassword;

	/**
	 * Password encoder for actuator credentials.
	 */
	@Bean
	public PasswordEncoder actuatorPasswordEncoder() {
		return new BCryptPasswordEncoder();
	}

	/**
	 * In-memory user details service for actuator authentication.
	 */
	@Bean
	public UserDetailsService actuatorUserDetailsService() {
		UserDetails actuatorUser = User.builder().username(actuatorUsername)
				.password(actuatorPasswordEncoder().encode(actuatorPassword)).roles("ACTUATOR").build();

		return new InMemoryUserDetailsManager(actuatorUser);
	}

	/**
	 * Security filter chain specifically for actuator endpoints. Uses HTTP Basic
	 * auth (separate from JWT tokens). Order set to 1 to process before main
	 * security config (order 100).
	 */
	@Bean
	@Order(1)
	public SecurityFilterChain actuatorSecurityFilterChain(HttpSecurity http) throws Exception {
		http.securityMatcher(EndpointRequest.toAnyEndpoint()).authorizeHttpRequests(auth -> auth
				// Health and info are public for load balancers/monitoring
				.requestMatchers(EndpointRequest.to("health", "info")).permitAll()
				// Liveness/readiness probes public for Kubernetes/container orchestration
				.requestMatchers("/actuator/health/liveness", "/actuator/health/readiness").permitAll()
				// All other actuator endpoints require authentication
				.anyRequest().hasRole("ACTUATOR")).userDetailsService(actuatorUserDetailsService())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.httpBasic(Customizer.withDefaults()).csrf(csrf -> csrf.disable());

		return http.build();
	}
}