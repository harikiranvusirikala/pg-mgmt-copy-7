package com.harikiran.pgmgmt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.Tenant;

public interface TenantRepository extends MongoRepository<Tenant, String> {
	Optional<Tenant> findByEmail(String email);

	List<Tenant> findByDueFalseAndRenewalDateNotNullAndContinuousStayTrue();

	List<Tenant> findByIsActiveTrueAndRoomNoNotNull();

	List<Tenant> findByContinuousStayFalseAndRoomNoNotNullAndRenewalDateNotNullOrderByRenewalDateAsc();

	List<Tenant> findByContinuousStayTrueAndRoomNoNotNullAndDueTrueOrderByRenewalDateAsc();
}