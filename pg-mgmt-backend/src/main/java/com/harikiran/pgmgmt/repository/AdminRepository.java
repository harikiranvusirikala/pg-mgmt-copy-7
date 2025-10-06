package com.harikiran.pgmgmt.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.Admin;

/**
 * Repository for managing administrator accounts.
 */
public interface AdminRepository extends MongoRepository<Admin, String> {
//	Admin findByEmail(String email);

	/**
	 * Finds an admin account using the unique email provided during Google
	 * authentication.
	 *
	 * @param email admin email address
	 * @return admin record wrapped in an {@link Optional}
	 */
	Optional<Admin> findByEmail(String email);

}
