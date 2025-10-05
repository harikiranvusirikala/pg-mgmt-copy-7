package com.harikiran.pgmgmt.controller;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
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

import com.harikiran.pgmgmt.model.Room;
import com.harikiran.pgmgmt.model.Tenant;
import com.harikiran.pgmgmt.repository.RoomRepository;
import com.harikiran.pgmgmt.repository.TenantRepository;

@RestController
@RequestMapping("/api/tenants")
/**
 * Manages tenant CRUD APIs plus status, profile, and room assignment updates.
 */
public class TenantController {

	private final TenantRepository tenantRepo;
	private final RoomRepository roomRepo;

	public TenantController(TenantRepository tenantRepo, RoomRepository roomRepo) {
		this.tenantRepo = tenantRepo;
		this.roomRepo = roomRepo;
	}

	@PreAuthorize("hasRole('ADMIN')")
	@GetMapping
	public List<Tenant> getAllTenants() {
		return tenantRepo.findAll();
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PostMapping
	public Tenant addTenant(@RequestBody Tenant tenant) {
		return tenantRepo.save(tenant);
	}

	@PreAuthorize("hasRole('ADMIN') or @tenantSecurity.isCurrentUserEmail(#email, authentication)")
	@GetMapping("/{email}")
	public Tenant getTenantByEmail(@PathVariable String email) {
		return tenantRepo.findByEmail(email).orElse(null);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PutMapping("/{id}")
	public Tenant updateTenant(@PathVariable String id, @RequestBody Tenant tenant) {
		tenant.setId(id);
		return tenantRepo.save(tenant);
	}

	@PreAuthorize("hasRole('ADMIN')")
	@DeleteMapping("/{id}")
	public void deleteTenant(@PathVariable String id) {
		tenantRepo.deleteById(id);
	}

	@PreAuthorize("hasRole('ADMIN') or @tenantSecurity.isOwnerById(#id, authentication)")
	@PatchMapping("/{id}/status")
	public ResponseEntity<Tenant> updateTenantStatus(@PathVariable String id,
			@RequestBody Map<String, Boolean> statusUpdate) {
		return tenantRepo.findById(id).map(tenant -> {
			Boolean active = statusUpdate.get("isActive");
			if (active != null) {
				tenant.setActive(active);
				tenantRepo.save(tenant);
			}
			return ResponseEntity.ok(tenant);
		}).orElse(ResponseEntity.notFound().build());
	}

	@PreAuthorize("hasRole('ADMIN') or @tenantSecurity.isOwnerById(#id, authentication)")
	@PatchMapping("/{id}/profile")
	public ResponseEntity<Tenant> updateTenantProfile(@PathVariable String id,
			@RequestBody Map<String, Object> updates) {
		return tenantRepo.findById(id).map(tenant -> {
			applyProfileUpdates(tenant, updates);
			tenantRepo.save(tenant);
			return ResponseEntity.ok(tenant);
		}).orElse(ResponseEntity.notFound().build());
	}

	@PreAuthorize("hasRole('ADMIN')")
	@PatchMapping("/{id}/room")
	public ResponseEntity<Tenant> updateTenantRoom(@PathVariable String id, @RequestBody Map<String, Object> request) {
		return tenantRepo.findById(id).map(tenant -> {
			String tenantId = tenant.getId();
			if (tenantId == null || tenantId.isBlank()) {
				return ResponseEntity.badRequest().<Tenant>build();
			}

			String requestedRoomNo = Optional.ofNullable(request.get("roomNo")).map(Object::toString).orElse(null);
			String normalizedNewRoomNo = normalizeRoomNo(requestedRoomNo);

			if (!applyRoomUpdate(tenant, tenantId, normalizedNewRoomNo)) {
				return ResponseEntity.badRequest().<Tenant>build();
			}

			Tenant savedTenant = tenantRepo.save(tenant);
			return ResponseEntity.ok(savedTenant);
		}).orElse(ResponseEntity.notFound().<Tenant>build());
	}

	private boolean applyRoomUpdate(Tenant tenant, String tenantId, String normalizedNewRoomNo) {
		String existingRoomNo = normalizeRoomNo(tenant.getRoomNo());

		if (Objects.equals(existingRoomNo, normalizedNewRoomNo)) {
			return true;
		}

		Room newRoom = null;
		if (normalizedNewRoomNo != null) {
			newRoom = roomRepo.findByRoomNo(normalizedNewRoomNo);
			if (newRoom == null || !canAssignTenantToRoom(newRoom, tenantId)) {
				return false;
			}
		}

		if (existingRoomNo != null) {
			removeTenantFromRoom(existingRoomNo, tenantId);
		}

		if (newRoom != null) {
			addTenantToRoom(newRoom, tenantId);
			tenant.setRoomNo(normalizedNewRoomNo);
		} else {
			tenant.setRoomNo(null);
		}

		return true;
	}

	private String normalizeRoomNo(String roomNo) {
		if (roomNo == null) {
			return null;
		}

		String trimmed = roomNo.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	private boolean canAssignTenantToRoom(Room room, String tenantId) {
		List<String> tenantIds = Optional.ofNullable(room.getTenantIds()).orElse(List.of());
		if (tenantIds.contains(tenantId)) {
			return true;
		}

		int capacity = Math.max(room.getCapacity(), 0);
		if (capacity == 0) {
			return true;
		}

		int currentSize = tenantIds.size();
		return currentSize < capacity;
	}

	private void addTenantToRoom(Room room, String tenantId) {
		List<String> tenantIds = Optional.ofNullable(room.getTenantIds()).map(ArrayList::new).orElseGet(ArrayList::new);
		if (!tenantIds.contains(tenantId)) {
			tenantIds.add(tenantId);
		}
		room.setTenantIds(tenantIds);
		room.setAllocatedCount(Math.max(tenantIds.size(), 0));
		roomRepo.save(room);
	}

	private void removeTenantFromRoom(String roomNo, String tenantId) {
		Room existingRoom = roomRepo.findByRoomNo(roomNo);
		if (existingRoom == null) {
			return;
		}

		List<String> tenantIds = Optional.ofNullable(existingRoom.getTenantIds()).map(ArrayList::new)
				.orElseGet(ArrayList::new);
		boolean modified = tenantIds.removeIf(id -> Objects.equals(id, tenantId));
		if (modified || existingRoom.getAllocatedCount() != tenantIds.size()) {
			existingRoom.setTenantIds(tenantIds);
			existingRoom.setAllocatedCount(Math.max(tenantIds.size(), 0));
			roomRepo.save(existingRoom);
		}
	}

	private Date convertToDate(Object rawValue) {
		if (rawValue == null) {
			return null;
		}

		if (rawValue instanceof Number numberValue) {
			return new Date(numberValue.longValue());
		}

		String stringValue = rawValue.toString().trim();
		if (stringValue.isEmpty()) {
			return null;
		}

		try {
			Instant instant = Instant.parse(stringValue);
			return Date.from(instant);
		} catch (DateTimeParseException ignored) {
			// Try parsing as a date without time (e.g., 2025-02-01)
			try {
				LocalDate localDate = LocalDate.parse(stringValue);
				return Date.from(localDate.atStartOfDay().toInstant(ZoneOffset.UTC));
			} catch (DateTimeParseException innerIgnored) {
				return null;
			}
		}
	}

	private boolean convertToBoolean(Object rawValue) {
		if (rawValue == null) {
			return false;
		}

		if (rawValue instanceof Boolean booleanValue) {
			return booleanValue;
		}

		String stringValue = rawValue.toString().trim();
		if (stringValue.isEmpty()) {
			return false;
		}

		return Boolean.parseBoolean(stringValue);
	}

	private void applyProfileUpdates(Tenant tenant, Map<String, Object> updates) {
		if (updates.containsKey("phone")) {
			Object phoneValue = updates.get("phone");
			tenant.setPhone(phoneValue != null ? phoneValue.toString() : null);
		}
		if (updates.containsKey("mealPreference")) {
			Object mealValue = updates.get("mealPreference");
			tenant.setMealPreference(mealValue != null ? mealValue.toString() : null);
		}
		if (updates.containsKey("renewalDate")) {
			Object renewalDateValue = updates.get("renewalDate");
			tenant.setRenewalDate(convertToDate(renewalDateValue));
			tenant.setDue(false);
		}
		if (updates.containsKey("continuousStay")) {
			Object continuousStayValue = updates.get("continuousStay");
			tenant.setContinuousStay(convertToBoolean(continuousStayValue));
		}
		if (updates.containsKey("due")) {
			Object dueValue = updates.get("due");
			tenant.setDue(convertToBoolean(dueValue));
		}
	}
}