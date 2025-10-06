package com.harikiran.pgmgmt.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.Room;

/**
 * Repository exposing core room lookups for allocation workflows.
 */
public interface RoomRepository extends MongoRepository<Room, String> {

	/**
	 * Fetches a room document using its human readable room number.
	 *
	 * @param roomNo room number displayed to tenants
	 * @return matching room or {@code null} when none is found
	 */
	Room findByRoomNo(String roomNo);
}