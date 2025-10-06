package com.harikiran.pgmgmt.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.AllocationStats;

/**
 * Repository providing access to room allocation snapshots.
 */
public interface AllocationStatsRepository extends MongoRepository<AllocationStats, String> {

	/**
	 * Fetches a snapshot for the given day if one has already been captured.
	 *
	 * @param statsDate day of the snapshot
	 * @return optional allocation snapshot
	 */
	Optional<AllocationStats> findByStatsDate(Date statsDate);

	/**
	 * Returns all snapshots ordered by day for time-series reporting.
	 *
	 * @return ordered list of allocation stats
	 */
	List<AllocationStats> findAllByOrderByStatsDateAsc();

}
