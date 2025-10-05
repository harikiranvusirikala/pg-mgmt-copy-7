package com.harikiran.pgmgmt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.harikiran.pgmgmt.model.Tenant;
import com.harikiran.pgmgmt.repository.TenantRepository;

@ExtendWith(MockitoExtension.class)
class TenantDueSchedulerTest {

	@Mock
	private TenantRepository tenantRepository;

	private TenantDueScheduler scheduler;

	@BeforeEach
	void setUp() {
		scheduler = new TenantDueScheduler(tenantRepository);
	}

	@Test
	void marksTenantsAsDueWhenRenewalDateIsReached() {
		Tenant tenantDueToday = buildTenant("today", LocalDate.of(2025, 10, 3));
		Tenant tenantDueFuture = buildTenant("future", LocalDate.of(2025, 10, 5));
		Tenant tenantDuePast = buildTenant("past", LocalDate.of(2025, 9, 30));

		when(tenantRepository.findByDueFalseAndRenewalDateNotNullAndContinuousStayTrue())
				.thenReturn(Arrays.asList(tenantDueToday, tenantDueFuture, tenantDuePast));

		scheduler.processTenantsForDue(LocalDate.of(2025, 10, 3));

		@SuppressWarnings("unchecked")
		ArgumentCaptor<List<Tenant>> captor = ArgumentCaptor.forClass(List.class);
		verify(tenantRepository).saveAll(captor.capture());

		List<Tenant> savedTenants = captor.getValue();
		assertEquals(2, savedTenants.size());
		assertTrue(savedTenants.stream().anyMatch(t -> "today".equals(t.getId())));
		assertTrue(savedTenants.stream().anyMatch(t -> "past".equals(t.getId())));
		assertTrue(savedTenants.stream().allMatch(Tenant::isDue));
		assertFalse(tenantDueFuture.isDue());
	}

	@Test
	void skipsSaveWhenNoTenantsRequireUpdate() {
		when(tenantRepository.findByDueFalseAndRenewalDateNotNullAndContinuousStayTrue()).thenReturn(List.of());

		scheduler.processTenantsForDue(LocalDate.of(2025, 10, 3));

		verify(tenantRepository, never()).saveAll(any());
	}

	private Tenant buildTenant(String id, LocalDate renewalDate) {
		Tenant tenant = new Tenant("Test", id + "@example.com", null);
		tenant.setId(id);
		tenant.setDue(false);
		Date renewal = Date.from(renewalDate.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant());
		tenant.setRenewalDate(renewal);
		return tenant;
	}
}
