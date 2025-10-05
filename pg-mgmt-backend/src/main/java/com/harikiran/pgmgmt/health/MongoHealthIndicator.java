package com.harikiran.pgmgmt.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

/**
 * Custom health indicator for MongoDB connectivity. Checks database connection
 * and basic operations.
 */
@Component
public class MongoHealthIndicator implements HealthIndicator {

	private final MongoTemplate mongoTemplate;

	public MongoHealthIndicator(MongoTemplate mongoTemplate) {
		this.mongoTemplate = mongoTemplate;
	}

	@Override
	public Health health() {
		try {
			// Attempt to get database stats as connectivity check
			mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));

			String databaseName = mongoTemplate.getDb().getName();
			long collectionCount = mongoTemplate.getDb().listCollectionNames().into(new java.util.ArrayList<>()).size();

			return Health.up().withDetail("database", databaseName).withDetail("collections", collectionCount)
					.withDetail("status", "Connected ✅").build();

		} catch (Exception e) {
			return Health.down().withDetail("error", e.getMessage()).withDetail("status", "Connection failed ❌")
					.build();
		}
	}
}