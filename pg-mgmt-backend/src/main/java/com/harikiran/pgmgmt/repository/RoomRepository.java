package com.harikiran.pgmgmt.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.harikiran.pgmgmt.model.Room;

public interface RoomRepository extends MongoRepository<Room, String> {
	Room findByRoomNo(String roomNo);
}