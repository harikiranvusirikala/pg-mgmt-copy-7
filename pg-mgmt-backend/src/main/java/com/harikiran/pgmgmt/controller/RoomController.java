package com.harikiran.pgmgmt.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.harikiran.pgmgmt.dto.RoomUpdateRequest;
import com.harikiran.pgmgmt.model.Room;
import com.harikiran.pgmgmt.repository.RoomRepository;

@RestController
@RequestMapping("/api/rooms")
@PreAuthorize("hasRole('ADMIN')")
/** Exposes CRUD endpoints for managing rooms and their capacity. */
public class RoomController {

	private final RoomRepository roomRepo;

	public RoomController(RoomRepository roomRepo) {
		this.roomRepo = roomRepo;
	}

	@GetMapping
	public List<Room> getAllRooms() {
		return roomRepo.findAll();
	}

	@PostMapping
	public Room addRoom(@RequestBody Room room) {
		if (room.getRoomNo() != null) {
			room.setRoomNo(room.getRoomNo().trim());
		}

		if (room.getFloorNo() != null) {
			room.setFloorNo(room.getFloorNo().trim());
		}

		room.setAllocatedCount(0);
		return roomRepo.save(room);
	}

	@GetMapping("/{roomNo}")
	public Room getRoomByNumber(@PathVariable String roomNo) {
		return roomRepo.findByRoomNo(roomNo);
	}

	@PutMapping("/{id}")
	public Room updateRoom(@PathVariable String id, @RequestBody Room room) {
		room.setId(id);
		return roomRepo.save(room);
	}

	@PatchMapping("/{id}")
	public Room updateRoomDetails(@PathVariable String id, @RequestBody RoomUpdateRequest request) {
		Room room = roomRepo.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));

		if (request.capacity() != null) {
			room.setCapacity(request.capacity());
		}

		if (request.comments() != null) {
			String trimmed = request.comments().trim();
			room.setComments(trimmed.isEmpty() ? null : trimmed);
		}

		return roomRepo.save(room);
	}

	@DeleteMapping("/{id}")
	public void deleteRoom(@PathVariable String id) {
		roomRepo.deleteById(id);
	}
}