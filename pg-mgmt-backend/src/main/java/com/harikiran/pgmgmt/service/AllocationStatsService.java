package com.harikiran.pgmgmt.service;

import java.time.Instant;
import java.util.Date;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.harikiran.pgmgmt.model.AllocationStats;
import com.harikiran.pgmgmt.model.Room;
import com.harikiran.pgmgmt.repository.AllocationStatsRepository;
import com.harikiran.pgmgmt.repository.RoomRepository;

@Service
/** Tracks room capacity allocation metrics and persists daily snapshots. */
public class AllocationStatsService {

	private static final Logger logger = LoggerFactory.getLogger(AllocationStatsService.class);

	private final RoomRepository roomRepository;
	private final AllocationStatsRepository allocationStatsRepository;

	public AllocationStatsService(RoomRepository roomRepository, AllocationStatsRepository allocationStatsRepository) {
		this.roomRepository = roomRepository;
		this.allocationStatsRepository = allocationStatsRepository;
	}

	public AllocationSnapshot computeCurrentSnapshot() {
		List<Room> rooms = roomRepository.findAll();

		long totalCapacity = rooms.stream().mapToLong(Room::getCapacity).sum();
		long allocated = rooms.stream().mapToLong(Room::getAllocatedCount).sum();
		long vacant = Math.max(totalCapacity - allocated, 0);

		if (logger.isDebugEnabled()) {
			logger.debug("Computed allocation snapshot totals total={} allocated={} vacant={}", totalCapacity,
					allocated, vacant);
		}

		return new AllocationSnapshot(totalCapacity, allocated, vacant);
	}

	public AllocationStats captureSnapshot(Date statsDate) {
		AllocationSnapshot snapshot = computeCurrentSnapshot();

		AllocationStats stats = allocationStatsRepository.findByStatsDate(statsDate)
				.orElseGet(() -> new AllocationStats(statsDate));

		stats.setTotalCount(snapshot.totalCapacity());
		stats.setAllocatedCount(snapshot.allocatedCount());
		stats.setVacantCount(snapshot.vacantCount());
		stats.setCapturedAt(Instant.now());

		AllocationStats saved = allocationStatsRepository.save(stats);

		if (logger.isInfoEnabled()) {
			logger.info("Persisted allocation stats for date={} total={} allocated={} vacant={}", statsDate,
					snapshot.totalCapacity(), snapshot.allocatedCount(), snapshot.vacantCount());
		}

		return saved;
	}

	public List<AllocationStats> loadChronologicalStats() {
		List<AllocationStats> stats = allocationStatsRepository.findAllByOrderByStatsDateAsc();

		if (logger.isDebugEnabled()) {
			logger.debug("Loaded {} allocation stats records", stats.size());
		}

		return stats;
	}

	public record AllocationSnapshot(long totalCapacity, long allocatedCount, long vacantCount) {
	}
}
