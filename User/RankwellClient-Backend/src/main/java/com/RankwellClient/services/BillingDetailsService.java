package com.RankwellClient.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.RankwellClient.dto.BillingDetailsDto;
import com.RankwellClient.entity.BillingDetails;
import com.RankwellClient.entity.Users;
import com.RankwellClient.repository.BillingDetailsRepository;
import com.RankwellClient.repository.UserRepository;

@Service
public class BillingDetailsService {

	private final BillingDetailsRepository billingRepo;
	private final UserRepository userRepository;

	public BillingDetailsService(BillingDetailsRepository billingRepo, UserRepository userRepository) {
		this.billingRepo = billingRepo;
		this.userRepository = userRepository;
	}

	public BillingDetailsDto getForUser(Long userId) {
		return billingRepo.findByUserId(userId).map(this::toDto).orElseGet(() -> {
			BillingDetailsDto d = new BillingDetailsDto();
			d.setSameAsCompany(true);
			return d;
		});
	}

	public BillingDetailsDto upsertForUser(Long userId, BillingDetailsDto body) {
		Users u = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

		BillingDetails b = billingRepo.findByUserId(userId).orElseGet(() -> {
			BillingDetails x = new BillingDetails();
			x.setUser(u);
			return x;
		});

		boolean same = body != null && body.isSameAsCompany();
		b.setSameAsCompany(same);

		if (body != null) {
			// GST can be updated regardless of profile choice.
			b.setBillingGstNo(trimOrNull(body.getBillingGstNo()));

			if (!same) {
				// Custom billing profile: update all fields.
				b.setBillingName(trimOrNull(body.getBillingName()));
				b.setBillingEmail(trimOrNull(body.getBillingEmail()));
				b.setBillingPhone(trimOrNull(body.getBillingPhone()));
				b.setBillingAddress(trimOrNull(body.getBillingAddress()));
			}
			// When sameAsCompany=true, keep existing custom fields intact so user doesn't lose saved custom billing.
		}

		BillingDetails saved = billingRepo.save(b);
		return toDto(saved);
	}

	private BillingDetailsDto toDto(BillingDetails b) {
		BillingDetailsDto d = new BillingDetailsDto();
		d.setSameAsCompany(b.isSameAsCompany());
		d.setBillingName(b.getBillingName());
		d.setBillingEmail(b.getBillingEmail());
		d.setBillingPhone(b.getBillingPhone());
		d.setBillingAddress(b.getBillingAddress());
		d.setBillingGstNo(b.getBillingGstNo());
		return d;
	}

	private static String trimOrNull(String s) {
		if (s == null) return null;
		String t = s.trim();
		return t.isEmpty() ? null : t;
	}
}

