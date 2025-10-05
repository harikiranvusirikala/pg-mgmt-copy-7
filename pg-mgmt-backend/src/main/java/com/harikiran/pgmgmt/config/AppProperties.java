package com.harikiran.pgmgmt.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
	
	@Value("${cors.frontend-uri}")
	private static String frontendURI;

	private final Cors cors = new Cors();

	public Cors getCors() {
		return cors;
	}

	public static class Cors {

		private List<String> allowedOrigins = new ArrayList<>(
				List.of("http://localhost:4200", "http://localhost:4210", frontendURI));

		public List<String> getAllowedOrigins() {
			return allowedOrigins;
		}

		public void setAllowedOrigins(List<String> allowedOrigins) {
			this.allowedOrigins = allowedOrigins;
		}
	}
}
