package com.harikiran.pgmgmt.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.AllocationStats;

public interface AllocationStatsRepository extends MongoRepository<AllocationStats, String> {

	Optional<AllocationStats> findByStatsDate(Date statsDate);

	List<AllocationStats> findAllByOrderByStatsDateAsc();

}
