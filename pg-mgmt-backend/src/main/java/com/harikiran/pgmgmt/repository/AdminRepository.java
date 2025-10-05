package com.harikiran.pgmgmt.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.Admin;

public interface AdminRepository extends MongoRepository<Admin, String> {
//	Admin findByEmail(String email);
	Optional<Admin> findByEmail(String email);

}
