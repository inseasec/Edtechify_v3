package com.RankwellClient.repository;

import com.RankwellClient.entity.Careers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional; 

@Repository
public interface CareersRepository extends JpaRepository<Careers, Long>{

    @Query("SELECT c FROM Careers c " + "WHERE c.applyFor.id = :applyForId " + "AND (c.email = :email OR c.phone = :phone)")
    Optional<Careers> findDuplicate(
            @Param("applyForId") Long applyForId,
            @Param("email") String email,
            @Param("phone") String phone);

    /** Generic teaching applicant (no specific job row — subjects only). */
    @Query("SELECT c FROM Careers c WHERE c.applyFor IS NULL AND (c.phone IS NOT NULL AND TRIM(c.phone) = TRIM(:phone))")
    Optional<Careers> findTeachingApplicantDuplicateByPhone(@Param("phone") String phone);

    @Query("SELECT c FROM Careers c WHERE c.applyFor IS NULL AND (c.email IS NOT NULL AND LOWER(TRIM(c.email)) = LOWER(TRIM(:email)))")
    Optional<Careers> findTeachingApplicantDuplicateByEmail(@Param("email") String email);

    Optional<Careers> findFirstByEmailIgnoreCase(String email);

    @Query("SELECT c FROM Careers c WHERE c.phone = :phone OR c.phone LIKE %:last10")
    Optional<Careers> findFirstByPhoneEqualsOrPhoneEndsWith(@Param("phone") String phone, @Param("last10") String last10);
}
