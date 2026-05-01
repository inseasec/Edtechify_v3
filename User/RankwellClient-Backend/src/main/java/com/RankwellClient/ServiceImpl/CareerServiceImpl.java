package com.RankwellClient.ServiceImpl;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.RankwellClient.Exception.AlreadyAppliedException;
import com.RankwellClient.config.StoragePathResolver;
import com.RankwellClient.dto.CareerRequestDto;
import com.RankwellClient.dto.UploadType;
import com.RankwellClient.entity.ApplyFor;
import com.RankwellClient.entity.ArchivedCareers;
import com.RankwellClient.entity.Careers;
import com.RankwellClient.repository.ApplyForRepository;
import com.RankwellClient.repository.CareerArchiveRepository;
import com.RankwellClient.repository.CareersRepository;
import com.RankwellClient.services.CareersService;


@Service
public class CareerServiceImpl implements CareersService {

   
    private final StoragePathResolver pathResolver;

    @Autowired
    private CareerArchiveRepository careerArchiveRepository; 

    @Autowired
    private ApplyForRepository applyForRepository;
      
      
    private static final String CAREERS_UPLOAD_DIR = "Careers"; 

    private final CareersRepository careersRepository;

    public CareerServiceImpl(CareersRepository careersRepository,StoragePathResolver pathResolver) {
        this.careersRepository = careersRepository;
        this.pathResolver=pathResolver; 
    }
     
    @Override 
    public Careers createCareer(CareerRequestDto request, MultipartFile resumeFile,MultipartFile videoFile) {

          //DUPLICATE CHECK 
          Optional<Careers> active = 
          careersRepository.findDuplicate(request.getApplyFor(),request.getEmail(),request.getPhone());
          
          if (active.isPresent()){
             throw new AlreadyAppliedException("You already applied for this job",
                                               active.get().getApplicationDate());
             }

           ArchivedCareers archived = careerArchiveRepository.findByEmailAndPhone(request.getEmail(), request.getPhone())
                                                          .orElse(null);  // null if no previous application
            if(archived != null){
                   throw new AlreadyAppliedException( "You already applied for this job",archived.getApplicationDate());
                 }
            
        // getPath
        String comprehensivePath = pathResolver.getCareerBasePath();
      //   //Validate resume
      //   validateFiles(resumeFile, UploadType.RESUME); 
      //   validateFiles(videoFile,UploadType.VIDEO);

        Careers career = new Careers();
        career.setFullName(request.getFullName());
        career.setEmail(request.getEmail());
        career.setPhone(request.getPhone());
        career.setCity(request.getCity());
        career.setExperienceLevel(request.getExperienceLevel()); 
        career.setSubjects(request.getSubjects()); 
        career.setGender(request.getGender());
        career.setDob(request.getDob());
        career.setQualification(request.getQualification());
        career.setCurrentSalary(request.getCurrentSalary());
        career.setExpectedSalary(request.getExpectedSalary());
        career.setMaritalStatus(request.getMaritalStatus());
        career.setState(request.getState());

        String optionalVideoLink = request.getVideoUrl();
        if (optionalVideoLink != null) {
            optionalVideoLink = optionalVideoLink.trim();
        }
        career.setVideoUrl(
                optionalVideoLink != null && !optionalVideoLink.isEmpty()
                        ? optionalVideoLink
                        : null);

          ApplyFor applyFor = null;
          if (request.getApplyFor() != null) {
                applyFor =
                        applyForRepository
                                .findById(request.getApplyFor())
                                .orElseThrow(() -> new RuntimeException("ApplyFor not found"));
          } else {
                String subj = request.getSubjects();
                if (subj == null || subj.trim().isEmpty()) {
                    throw new IllegalArgumentException(
                            "Teaching applicants must specify the subjects/specialties they teach.");
                }
          }

               // Resume is optional for all roles. If provided, validate and store it.
               if (resumeFile != null && !resumeFile.isEmpty()) {
                    validateFiles(resumeFile, UploadType.RESUME);
                    String resumePath = saveFile(resumeFile, comprehensivePath);
                    career.setResume(resumePath);
               }

// Video is mandatory for all applications.
              //  if (videoFile == null || videoFile.isEmpty()) {
              //       throw new IllegalArgumentException("Intro video is mandatory");
              //  }
             
               validateFiles(videoFile, UploadType.VIDEO);
               String videoPath = saveFile(videoFile, comprehensivePath);
               career.setVideo(videoPath);
 
            if(request.getStatus() == null){
                career.setStatus("APPLIED");
              }
 
            career.setApplyFor(applyFor);
          
              
             
         return careersRepository.save(career);                        
      }

    /** Last 10 digits for Indian mobile comparisons. */
    private static String normalizePhoneDigits(String raw) {
        if (raw == null) return "";
        String d = raw.replaceAll("\\D", "");
        if (d.length() >= 10) return d.substring(d.length() - 10);
        return d;
    }

    /**
     * Self-service updates: allow if normalized email matches OR last-10-digit phone matches.
     * Stored rows sometimes omit phone or normalize differently; requiring both caused false 403s.
     */
    private void verifySameApplicant(Careers career, CareerRequestDto request) {
        String reqEmail = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String savedEmail = career.getEmail() == null ? "" : career.getEmail().trim().toLowerCase();
        String rq = normalizePhoneDigits(request.getPhone());
        String sq = normalizePhoneDigits(career.getPhone());

        boolean emailMatch = !reqEmail.isEmpty() && reqEmail.equals(savedEmail);
        boolean phoneMatch =
                rq.length() >= 10 && sq.length() >= 10 && rq.equals(sq);

        if (emailMatch || phoneMatch) {
            return;
        }
        throw new IllegalArgumentException("Unauthorized to update this application");
    }

    @Override
    public Careers updateCareer(Long id, CareerRequestDto request, MultipartFile resumeFile, MultipartFile videoFile) {
        Careers career = careersRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        verifySameApplicant(career, request);

        ApplyFor applyFor = null;
        if (request.getApplyFor() != null) {
            applyFor = applyForRepository
                    .findById(request.getApplyFor())
                    .orElseThrow(() -> new RuntimeException("ApplyFor not found"));
        } else {
            String subj = request.getSubjects();
            if (subj == null || subj.trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Teaching applicants must specify the subjects/specialties they teach.");
            }
        }

        String comprehensivePath = pathResolver.getCareerBasePath();

        career.setFullName(request.getFullName());
        career.setCity(request.getCity());
        career.setExperienceLevel(request.getExperienceLevel());
        career.setSubjects(request.getSubjects());
        career.setGender(request.getGender());
        career.setDob(request.getDob());
        career.setQualification(request.getQualification());
        career.setCurrentSalary(request.getCurrentSalary());
        career.setExpectedSalary(request.getExpectedSalary());
        career.setMaritalStatus(request.getMaritalStatus());
        career.setState(request.getState());

        String optionalVideoLink = request.getVideoUrl();
        if (optionalVideoLink != null) {
            optionalVideoLink = optionalVideoLink.trim();
        }
        career.setVideoUrl(
                optionalVideoLink != null && !optionalVideoLink.isEmpty()
                        ? optionalVideoLink
                        : null);

        career.setApplyFor(applyFor);

        if (resumeFile != null && !resumeFile.isEmpty()) {
            validateFiles(resumeFile, UploadType.RESUME);
            String resumePath = saveFile(resumeFile, comprehensivePath);
            career.setResume(resumePath);
        }

        if (videoFile != null && !videoFile.isEmpty()) {
            validateFiles(videoFile, UploadType.VIDEO);
            String videoPath = saveFile(videoFile, comprehensivePath);
            career.setVideo(videoPath);
        }

        boolean hasStoredVideo =
                career.getVideo() != null && !career.getVideo().isBlank();
        if ((videoFile == null || videoFile.isEmpty()) && !hasStoredVideo) {
            throw new IllegalArgumentException("Intro video is required");
        }

        return careersRepository.save(career);
    }

    private Optional<Careers> findTeachingApplicantDuplicate(String email, String phone) {
        String ph = phone == null ? "" : phone.trim();
        String em = email == null ? "" : email.trim();
        if (!ph.isEmpty()) {
            Optional<Careers> byPhone =
                    careersRepository.findTeachingApplicantDuplicateByPhone(ph);
            if (byPhone.isPresent()) {
                return byPhone;
            }
        }
        if (!em.isEmpty()) {
            return careersRepository.findTeachingApplicantDuplicateByEmail(em);
        }
        return Optional.empty();
    }
       
     private String saveFile(MultipartFile file, String comprehensivePath) {

           if(file ==null || file.isEmpty()){
              throw new IllegalArgumentException("file is required");
           }
          File uploadDir = new File(comprehensivePath, CAREERS_UPLOAD_DIR);

              if (!uploadDir.exists()) {
                 uploadDir.mkdirs();
              }
          String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                File destination = new File(uploadDir, fileName);

             try {
                file.transferTo(destination);
               }
             catch (IOException e){
               throw new RuntimeException("Failed to save file", e);
             }
             
            // Store relative path so Admin UI can build `${apiBase}/${path}`
            return CAREERS_UPLOAD_DIR + "/" + fileName;
        }

       // RESUMe and video validation //
    private void validateFiles(MultipartFile file,UploadType type){
         if (file == null || file.isEmpty()) {
             throw new IllegalArgumentException(type + " file is required");
         }

          long maxSize;
          List<String> allowedMimeTypes;
          List<String> allowedExtensions;

          switch (type) {
            case RESUME:
            maxSize = 15 * 1024 * 1024; // 15MB
            allowedMimeTypes = List.of("application/pdf","application/msword",
                                       "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            allowedExtensions = List.of(".pdf", ".doc", ".docx");

             break;

             case VIDEO:
              maxSize = 150 * 1024 * 1024; // 150MB
              allowedMimeTypes = List.of("video/mp4", "video/webm","video/ogg");
              allowedExtensions = List.of(".mp4", ".webm", ".ogg");
            break;

          default:
            throw new IllegalStateException("Unexpected upload type");
          }

          if(file.getSize() > maxSize){
              throw new IllegalArgumentException(type + " size exceeds allowed limit");
             }

             String contentType = file.getContentType();
             String filename = file.getOriginalFilename();

           if (contentType == null || filename == null) {
              throw new RuntimeException("Invalid " + type + " file");
           }

          boolean validMime = allowedMimeTypes.contains(contentType);
          boolean validExt = allowedExtensions.stream()
            .anyMatch(ext -> filename.toLowerCase().endsWith(ext));

          if (!validMime || !validExt) {
             throw new RuntimeException("Invalid " + type + " file format");
          }
    }

} 

