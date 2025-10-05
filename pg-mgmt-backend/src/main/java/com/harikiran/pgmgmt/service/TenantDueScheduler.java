package com.harikiran.pgmgmt.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.harikiran.pgmgmt.model.Tenant;
import com.harikiran.pgmgmt.repository.TenantRepository;

@Component
/** Nightly job that flags tenants whose renewal dates have passed. */
public class TenantDueScheduler {

	private static final Logger logger = LoggerFactory.getLogger(TenantDueScheduler.class);
	static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

	private final TenantRepository tenantRepository;

	public TenantDueScheduler(TenantRepository tenantRepository) {
		this.tenantRepository = tenantRepository;
	}

	@Scheduled(cron = "0 0 6 * * *", zone = "Asia/Kolkata")
	public void markTenantsWithDueRenewal() {
		processTenantsForDue(LocalDate.now(IST_ZONE));
	}

	void processTenantsForDue(LocalDate referenceDate) {
		List<Tenant> candidates = tenantRepository.findByDueFalseAndRenewalDateNotNullAndContinuousStayTrue();

		if (logger.isDebugEnabled()) {
			logger.debug("Evaluating tenant due status for date={} candidates={}", referenceDate, candidates.size());
		}

		if (candidates.isEmpty()) {
			logger.debug("No candidates found for due evaluation");
			return;
		}

		List<Tenant> tenantsToUpdate = candidates.stream().filter(tenant -> shouldMarkDue(tenant, referenceDate))
				.collect(Collectors.toList());

		if (tenantsToUpdate.isEmpty()) {
			logger.debug("No tenants met due criteria for date={}", referenceDate);
			return;
		}

		tenantsToUpdate.forEach(tenant -> tenant.setDue(true));
		tenantRepository.saveAll(tenantsToUpdate);

		if (logger.isInfoEnabled()) {
			logger.info("Marked {} tenant(s) as due based on renewal date", tenantsToUpdate.size());
		}

		if (logger.isDebugEnabled()) {
			tenantsToUpdate.forEach(tenant -> logger.debug("Tenant marked due id={} name='{}' roomNo={} renewalDate={}",
					tenant.getId(), tenant.getName(), tenant.getRoomNo(), tenant.getRenewalDate()));
		}
	}

	private boolean shouldMarkDue(Tenant tenant, LocalDate referenceDate) {
		Date renewalDate = tenant.getRenewalDate();
		if (renewalDate == null) {
			return false;
		}

		LocalDate renewalLocalDate = Instant.ofEpochMilli(renewalDate.getTime()).atZone(IST_ZONE).toLocalDate();
		return !renewalLocalDate.isAfter(referenceDate);
	}
}
