package com.harikiran.pgmgmt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.Tenant;

/**
 * Repository providing high-level tenant queries used by schedulers, dashboards
 * and administrative workflows.
 */
public interface TenantRepository extends MongoRepository<Tenant, String> {

	/**
	 * Finds a tenant based on the unique email address supplied by Google
	 * authentication.
	 *
	 * @param email unique email address
	 * @return tenant wrapped in an {@link Optional}
	 */
	Optional<Tenant> findByEmail(String email);

	/**
	 * Returns active tenants whose renewal date is set and who have opted for a
	 * continuous stay. Used by the due-status scheduler to decide who should be
	 * evaluated.
	 *
	 * @return tenants requiring due evaluation
	 */
	List<Tenant> findByDueFalseAndRenewalDateNotNullAndContinuousStayTrue();

	/**
	 * Fetches tenants currently active and assigned to a room. Used when computing
	 * allocation and meal statistics.
	 *
	 * @return tenants allocated to rooms
	 */
	List<Tenant> findByIsActiveTrueAndRoomNoNotNull();

	/**
	 * Lists tenants who intend to vacate (continuous stay disabled) ordered by the
	 * upcoming renewal date for dashboard alerts.
	 *
	 * @return tenants scheduled to vacate soon
	 */
	List<Tenant> findByContinuousStayFalseAndRoomNoNotNullAndRenewalDateNotNullOrderByRenewalDateAsc();

	/**
	 * Lists tenants on continuous stay whose payments are flagged as due, ordered
	 * by the renewal date so that staff can prioritise follow-ups.
	 *
	 * @return tenants with pending payments
	 */
	List<Tenant> findByContinuousStayTrueAndRoomNoNotNullAndDueTrueOrderByRenewalDateAsc();
}