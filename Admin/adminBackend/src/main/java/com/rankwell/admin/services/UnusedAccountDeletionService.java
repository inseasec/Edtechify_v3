package com.rankwell.admin.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rankwell.admin.config.StoragePathResolver;
import com.rankwell.admin.entity.Users;
import com.rankwell.admin.repository.EdukifyClientRepository;
import com.rankwell.admin.repository.InvoiceRepository;
import com.rankwell.admin.repository.PaymentRepository;
import com.rankwell.admin.repository.UserRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Permanent account removal: unused signups (no {@code clients} row) and launched clients
 * removed from the Clients subscription list. Deletes dependent billing rows and user media under
 * configured storage ({@code accounts/…}, paths stored on {@link Users#getUserImg()}).
 */
@Service
public class UnusedAccountDeletionService {

	private static final Logger log = LoggerFactory.getLogger(UnusedAccountDeletionService.class);

	private final EdukifyClientRepository eduClientRepository;
	private final UserRepository userRepository;
	private final InvoiceRepository invoiceRepository;
	private final PaymentRepository paymentRepository;
	private final StoragePathResolver storagePathResolver;

	@PersistenceContext
	private EntityManager entityManager;

	public UnusedAccountDeletionService(
			EdukifyClientRepository eduClientRepository,
			UserRepository userRepository,
			InvoiceRepository invoiceRepository,
			PaymentRepository paymentRepository,
			StoragePathResolver storagePathResolver) {
		this.eduClientRepository = eduClientRepository;
		this.userRepository = userRepository;
		this.invoiceRepository = invoiceRepository;
		this.paymentRepository = paymentRepository;
		this.storagePathResolver = storagePathResolver;
	}

	@Transactional
	public void deletePermanentIfNotLaunched(Long userId) {
		Long uid = Objects.requireNonNull(userId, "userId");
		if (eduClientRepository.findByUserId(uid).isPresent()) {
			throw new IllegalStateException(
					"This user has launched a portal. Manage or remove them from Clients instead.");
		}
		deleteUserAccountCascade(uid);
	}

	@Transactional
	public void deleteLaunchedClientPermanent(Long userId) {
		Long uid = Objects.requireNonNull(userId, "userId");
		if (eduClientRepository.findByUserId(uid).isEmpty()) {
			throw new IllegalStateException("No launched portal for this user.");
		}
		eduClientRepository.deleteByUserId(uid);
		deleteUserAccountCascade(uid);
	}

	private void deleteUserAccountCascade(Long uid) {
		Users user = userRepository.findById(uid)
				.orElseThrow(() -> new NoSuchElementException("User not found"));

		invoiceRepository.deleteAllByUserId(uid);
		paymentRepository.deleteAllByUserId(uid);
		entityManager.createNativeQuery("DELETE FROM billing_details WHERE user_id = ?")
				.setParameter(1, uid)
				.executeUpdate();

		deleteUserFilesystemArtifacts(user);

		userRepository.delete(user);
	}

	private Path normalizeBaseDirectory() throws IOException {
		String raw = storagePathResolver.getBasePath().replace('\\', '/');
		while (raw.endsWith("/")) {
			raw = raw.substring(0, raw.length() - 1);
		}
		Path base = Paths.get(raw).normalize().toAbsolutePath().normalize();
		if (!Files.isDirectory(base)) {
			throw new IOException("Storage base path is not a directory: " + base);
		}
		return base;
	}

	private boolean isUnderBase(Path base, Path candidate) throws IOException {
		Path root = base.toRealPath().normalize();
		Path cand = candidate.toAbsolutePath().normalize();
		Path candResolved = Files.exists(cand) ? cand.toRealPath().normalize() : cand;
		return candResolved.startsWith(root);
	}

	private void deleteUserFilesystemArtifacts(Users user) {
		Path base;
		try {
			base = normalizeBaseDirectory();
		} catch (IllegalStateException | IOException e) {
			log.warn("Skipping file cleanup — storage misconfigured or unreadable: {}", e.getMessage());
			return;
		}

		String folderToken = resolveAccountsFolderToken(user);
		if (folderToken != null && !folderToken.isBlank()) {
			Path accountsDir = base.resolve("accounts").resolve(folderToken).normalize();
			try {
				if (isUnderBase(base, accountsDir)) {
					deleteDirectoryRecursive(accountsDir);
				}
			} catch (IOException e) {
				log.warn("Could not remove accounts dir for user {}: {}", user.getId(), e.getMessage());
			}
		}

		String imgRel = user.getUserImg();
		if (imgRel != null && !imgRel.isBlank()) {
			String normRel = imgRel.replace('\\', '/').replaceFirst("^/+", "");
			Path resolved = base.resolve(normRel).normalize();
			try {
				if (!isUnderBase(base, resolved)) {
					log.warn("userImg escape attempt ignored for user {}: {}", user.getId(), normRel);
				} else if (Files.isRegularFile(resolved)) {
					Files.deleteIfExists(resolved);
				} else if (Files.isDirectory(resolved)) {
					deleteDirectoryRecursive(resolved);
				}
			} catch (IOException e) {
				log.warn("Could not delete userImg path for user {}: {}", user.getId(), e.getMessage());
			}
		}
	}

	static String resolveAccountsFolderToken(Users user) {
		if (user.getEmail() != null && !user.getEmail().isBlank()) {
			return user.getEmail();
		}
		return user.getMobileNo();
	}

	private static void deleteDirectoryRecursive(Path root) throws IOException {
		if (!Files.exists(root)) {
			return;
		}
		if (Files.isRegularFile(root)) {
			Files.deleteIfExists(root);
			return;
		}
		try (Stream<Path> walk = Files.walk(root)) {
			walk.sorted(Comparator.reverseOrder()).forEach(p -> {
				try {
					Files.deleteIfExists(p);
				} catch (IOException ignored) {
					log.debug("Skip delete {}", p);
				}
			});
		}
	}
}
