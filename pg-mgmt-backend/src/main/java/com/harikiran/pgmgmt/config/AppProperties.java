package com.harikiran.pgmgmt.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {

	private final Cors cors = new Cors();

	public Cors getCors() {
		return cors;
	}

	public static class Cors {

		@Value("#{'${app.cors.allowed-origins}'.split(',')}")
		private List<String> allowedOrigins;

		public List<String> getAllowedOrigins() {
			return allowedOrigins;
		}

		public void setAllowedOrigins(List<String> allowedOrigins) {
			this.allowedOrigins = allowedOrigins;
		}
	}
}
