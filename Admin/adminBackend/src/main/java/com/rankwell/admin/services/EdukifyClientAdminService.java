package com.rankwell.admin.services;



import java.time.Instant;

import java.time.LocalDate;

import java.time.ZoneId;

import java.time.temporal.ChronoUnit;

import java.util.List;

import java.util.Optional;

import java.util.stream.Collectors;



import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import com.rankwell.admin.dto.ClientPortalRowDto;

import com.rankwell.admin.dto.TrialDefaultsDto;
import com.rankwell.admin.dto.TrialLimitsOverrideDto;

import com.rankwell.admin.entity.EdukifyClient;

import com.rankwell.admin.entity.PlatformTrialDefaults;

import com.rankwell.admin.entity.Users;

import com.rankwell.admin.repository.EdukifyClientRepository;

import com.rankwell.admin.repository.PlatformTrialDefaultsRepository;

import com.rankwell.admin.repository.UserRepository;



@Service

public class EdukifyClientAdminService {



	private final UserRepository userRepository;

	private final EdukifyClientRepository eduClientRepository;

	private final PlatformTrialDefaultsRepository trialDefaultsRepository;

	private final PortalTrialAccessSyncService portalTrialAccessSyncService;



	@Value("${EDUKIFY_PORTAL_BASE_DOMAIN:edukify.com}")

	private String portalBaseDomain;



	public EdukifyClientAdminService(

			UserRepository userRepository,

			EdukifyClientRepository eduClientRepository,

			PlatformTrialDefaultsRepository trialDefaultsRepository,

			PortalTrialAccessSyncService portalTrialAccessSyncService) {

		this.userRepository = userRepository;

		this.eduClientRepository = eduClientRepository;

		this.trialDefaultsRepository = trialDefaultsRepository;

		this.portalTrialAccessSyncService = portalTrialAccessSyncService;

	}



	public List<ClientPortalRowDto> listPortalRows() {

		portalTrialAccessSyncService.reconcileAllClients();

		PlatformTrialDefaults platformDefaults = loadPlatformDefaultsSnapshot();

		List<Users> users = userRepository.findAllByOrderByIdDesc();

		return users.stream().map(u -> toRow(u, platformDefaults)).collect(Collectors.toList());

	}

	private PlatformTrialDefaults loadPlatformDefaultsSnapshot() {
		return trialDefaultsRepository.findById(1L).orElseGet(() -> {
			PlatformTrialDefaults d = new PlatformTrialDefaults();
			d.setId(1L);
			d.setTrialDurationDays(14);
			d.setTrialStorageMb(512);
			return d;
		});
	}

	@Transactional
	public ClientPortalRowDto updateTrialLimitsForUser(Long userId, TrialLimitsOverrideDto dto) {
		if (dto == null) {
			throw new IllegalArgumentException("Request body required");
		}
		EdukifyClient client = eduClientRepository.findByUserId(userId).orElseThrow(
				() -> new java.util.NoSuchElementException("No launched portal for this user"));
		if (Boolean.TRUE.equals(dto.getResetToPlatformDefaults())) {
			client.setTrialLimitDays(null);
			client.setTrialLimitStorageMb(null);
		} else {
			Integer d = dto.getTrialLimitDays();
			Integer mb = dto.getTrialLimitStorageMb();
			if (d == null || mb == null) {
				throw new IllegalArgumentException(
						"trialLimitDays and trialLimitStorageMb are required unless resetToPlatformDefaults is true");
			}
			if (d < 1 || d > 3650) {
				throw new IllegalArgumentException("trialLimitDays must be between 1 and 3650");
			}
			if (mb < 1 || mb > 1_000_000) {
				throw new IllegalArgumentException("trialLimitStorageMb must be between 1 and 1000000");
			}
			client.setTrialLimitDays(d);
			client.setTrialLimitStorageMb(mb);
		}
		eduClientRepository.save(client);
		portalTrialAccessSyncService.reconcileAllClients();
		Users owner = userRepository.findById(userId)
				.orElseThrow(() -> new java.util.NoSuchElementException("User not found"));
		return toRow(owner, loadPlatformDefaultsSnapshot());
	}



	public TrialDefaultsDto getTrialDefaults() {

		return trialDefaultsRepository.findById(1L)

				.map(d -> new TrialDefaultsDto(d.getTrialDurationDays(), d.getTrialStorageMb()))

				.orElse(new TrialDefaultsDto(14, 512));

	}



	@Transactional

	public TrialDefaultsDto updateTrialDefaults(TrialDefaultsDto dto) {

		int days = dto.getTrialDurationDays();

		int mb = dto.getTrialStorageMb();

		if (days < 1 || days > 3650) {

			throw new IllegalArgumentException("trialDurationDays must be between 1 and 3650");

		}

		if (mb < 1 || mb > 1_000_000) {

			throw new IllegalArgumentException("trialStorageMb must be between 1 and 1000000");

		}

		PlatformTrialDefaults entity = trialDefaultsRepository.findById(1L).orElseGet(() -> {

			PlatformTrialDefaults d = new PlatformTrialDefaults();

			d.setId(1L);

			return d;

		});

		entity.setTrialDurationDays(days);

		entity.setTrialStorageMb(mb);

		trialDefaultsRepository.save(entity);

		portalTrialAccessSyncService.reconcileAllClients();

		return getTrialDefaults();

	}



	private ClientPortalRowDto toRow(Users u, PlatformTrialDefaults platformDefaults) {

		ClientPortalRowDto row = new ClientPortalRowDto();

		row.setUserId(u.getId());

		row.setUserName(u.getUserName());

		row.setEmail(u.getEmail());

		row.setMobileNo(u.getMobileNo());

		row.setFrozen(u.isFrozen());

		row.setUserImg(u.getUserImg());

		Optional<EdukifyClient> opt = eduClientRepository.findByUserId(u.getId());

		if (opt.isEmpty()) {

			row.setPortalLaunched(false);

			row.setStorageUsedBytes(null);

			row.setDaysSincePortalLive(null);

			return row;

		}

		EdukifyClient c = opt.get();

		row.setPortalLaunched(true);

		row.setCompanyName(c.getCompanyName());

		row.setSubdomain(c.getSubdomain());

		String host = c.getSubdomain() + "." + portalBaseDomain;

		row.setPortalSiteUrl("https://" + host + "/");

		row.setPortalAdminUrl("https://" + host + "/admin");

		row.setContactPersonName(c.getContactPersonName());

		row.setPortalPhone(c.getPhone());

		row.setPortalEmail(c.getEmail());

		row.setSubscription(c.getSubscription() != null ? c.getSubscription() : "Trial");

		Long used = c.getStorageUsedBytes();

		row.setStorageUsedBytes(used != null ? used : 0L);

		Instant portalLiveAnchor = c.getPortalLaunchedAt();

		if (portalLiveAnchor == null) {

			portalLiveAnchor = u.getCreatedAt();

		}

		row.setDaysSincePortalLive(daysSinceInstant(portalLiveAnchor));

		LocalDate anchorDate = portalLiveAnchor.atZone(ZoneId.systemDefault()).toLocalDate();
		row.setTrialAnchorDate(anchorDate.toString());

		String pas = c.getPortalAccessStatus();
		row.setPortalAccessStatus(
				pas != null && !pas.isBlank() ? pas : PortalTrialAccessSyncService.STATUS_ACTIVE);

		row.setTrialLimitDaysOverride(c.getTrialLimitDays());
		row.setTrialLimitStorageMbOverride(c.getTrialLimitStorageMb());
		int effectiveDays = c.getTrialLimitDays() != null ? c.getTrialLimitDays()
				: platformDefaults.getTrialDurationDays();
		int effectiveMb = c.getTrialLimitStorageMb() != null ? c.getTrialLimitStorageMb()
				: platformDefaults.getTrialStorageMb();
		row.setEffectiveTrialLimitDays(effectiveDays);
		row.setEffectiveTrialLimitStorageMb(effectiveMb);

		return row;

	}



	private static Integer daysSinceInstant(Instant anchor) {

		if (anchor == null) {

			return null;

		}

		LocalDate start = anchor.atZone(ZoneId.systemDefault()).toLocalDate();

		long days = ChronoUnit.DAYS.between(start, LocalDate.now());

		return (int) Math.max(0, days);

	}

}

