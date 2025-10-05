package com.harikiran.pgmgmt.security;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.harikiran.pgmgmt.config.AppProperties;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

	private final AppProperties appProperties;

	private static final List<String> DEFAULT_ALLOWED_ORIGINS = List.of("http://localhost:4200",
			"http://localhost:4210");

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
			RestAuthenticationEntryPoint restAuthenticationEntryPoint, AppProperties appProperties) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
		this.restAuthenticationEntryPoint = restAuthenticationEntryPoint;
		this.appProperties = appProperties;
	}

	@SuppressWarnings("removal")
	@Bean
	@Order(100) // Process after actuator security (order 1)
	public SecurityFilterChain securityFilterChain(HttpSecurity http, AppProperties appProperties) throws Exception {

		http
				// Explicitly exclude actuator endpoints from this security chain
				.securityMatcher(request -> {
					String uri = request.getRequestURI();
					return !uri.startsWith("/actuator");
				}).csrf(csrf -> csrf.disable()).cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(ex -> ex.authenticationEntryPoint(restAuthenticationEntryPoint))
				.authorizeHttpRequests(authorize -> authorize.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/", "/index.html", "/favicon.ico", "/static/**", "/assets/**",
								"/actuator/health")
						.permitAll().requestMatchers("/auth/**").permitAll().anyRequest().authenticated())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.headers(headers -> {
					headers.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"));
					headers.referrerPolicy(referrer -> referrer
							.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
					headers.permissionsPolicy(policy -> policy.policy("camera=(), geolocation=(), microphone=()"));
					headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin);
					headers.httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true));
				});

		return http.build();
	}

	@Bean
	UserDetailsService noopUserDetailsService() {
		return username -> {
			throw new UsernameNotFoundException(
					"User lookups are handled by JWT tokens. Provided username: " + username);
		};
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowCredentials(true);
		configuration.setAllowedOriginPatterns(resolveAllowedOrigins());
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
		configuration.setExposedHeaders(List.of("Authorization"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}

	private List<String> resolveAllowedOrigins() {
		List<String> configuredOrigins = appProperties.getCors().getAllowedOrigins().stream().map(String::trim)
				.filter(origin -> !origin.isEmpty()).collect(Collectors.toList());

		return configuredOrigins.isEmpty() ? DEFAULT_ALLOWED_ORIGINS : configuredOrigins;
	}
}
