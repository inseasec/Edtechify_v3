package com.rankwell.admin.dto;

import com.rankwell.admin.entity.OrgGallery;
import com.rankwell.admin.entity.OrgHome;
import com.rankwell.admin.entity.OrgTeamGallery;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import com.rankwell.admin.dto.OrgAddressDTO;

public class OrganizationDetailDto {

	private Long id;
	
	private String orgName;
	private String orgAddress;
	private List<OrgAddressDTO> orgAddresses;
	private String orgPhone;
	private String orgEmail; 
	private String orgLogo;

	/** Paths hidden from public navbar/footer (e.g. ["/gallery"]). Home (/) is never configurable here. */
	private List<String> navbarHiddenPaths = new ArrayList<>();

	// private String title;
	// private  String description;
	
	private OrgAboutUsDTO orgAboutUs;
	private OrgDirectorDetailDTO orgDirectorDetail;
    private OrgParentCompanyDTO orgParentCompany;
	private OrgAchievementDTO orgAchievement; 
	private OrgGallery orgGallery;
	private OrgTeamGallery orgTeamGallery;
	private OrgHome orgHome;



  public OrgHome getOrgHome() {
    return orgHome;
   }

  public void setOrgHome(OrgHome orgHome) {
    this.orgHome = orgHome;
   }


// 	public String getTitle() {
//     return title;
//    }

//     public void setTitle(String title) {
//      this.title = title;
//    }

// // Getter and Setter for description
// public  String getDescription() {
//     return description;
//   }

// public void setDescription( String description) {
//     this.description = description;
// }     
	
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getOrgName() {
		return orgName;
	}
	public void setOrgName(String orgName) {
		this.orgName = orgName;
	}
	public String getOrgAddress() {
		return orgAddress;
	}
	public void setOrgAddress(String orgAddress) {
		this.orgAddress = orgAddress;
	}
	public List<OrgAddressDTO> getOrgAddresses() {
		return orgAddresses;
	}
	public void setOrgAddresses(List<OrgAddressDTO> orgAddresses) {
		this.orgAddresses = orgAddresses;
	}
	public String getOrgPhone() {
		return orgPhone;
	}
	public void setOrgPhone(String orgPhone) {
		this.orgPhone = orgPhone;
	}
	public String getOrgEmail() {
		return orgEmail;
	}
	public void setOrgEmail(String orgEmail) {
		this.orgEmail = orgEmail;
	}
	public String getOrgLogo() {
		return orgLogo;
	}
	public void setOrgLogo(String orgLogo) {
		this.orgLogo = orgLogo;
	}

	public List<String> getNavbarHiddenPaths() {
		return navbarHiddenPaths;
	}

	public void setNavbarHiddenPaths(List<String> navbarHiddenPaths) {
		this.navbarHiddenPaths = navbarHiddenPaths == null ? new ArrayList<>() : navbarHiddenPaths;
	}

	public OrgAboutUsDTO getOrgAboutUs() {
		return orgAboutUs;
	}
	public void setOrgAboutUs(OrgAboutUsDTO orgAboutUs) {
		this.orgAboutUs = orgAboutUs;
	}
	public OrgDirectorDetailDTO getOrgDirectorDetail() {
		return orgDirectorDetail;
	}
	public void setOrgDirectorDetail(OrgDirectorDetailDTO orgDirectorDetail) {
		this.orgDirectorDetail = orgDirectorDetail;
	}

    public OrgParentCompanyDTO getOrgParentCompany() {
        return orgParentCompany;
    }

    public void setOrgParentCompany(OrgParentCompanyDTO orgParentCompany) {
        this.orgParentCompany = orgParentCompany;
    }
	public OrgAchievementDTO getOrgAchievement() {
		return orgAchievement;
	}
	public void setOrgAchievement(OrgAchievementDTO orgAchievement) {
		this.orgAchievement = orgAchievement;
	}
	
	public OrgGallery getOrgGallery() {
		return orgGallery;
	}
	public void setOrgGallery(OrgGallery orgGallery) {
		this.orgGallery = orgGallery;
	}

	public OrgTeamGallery getOrgTeamGallery() {
		return orgTeamGallery;
	}

	public void setOrgTeamGallery(OrgTeamGallery orgTeamGallery) {
		this.orgTeamGallery = orgTeamGallery;
	}

	public OrganizationDetailDto() {
		super();
		// TODO Auto-generated constructor stub
	}
	public OrganizationDetailDto(Long id, String orgName, String orgAddress, String orgPhone, String orgEmail,
			String orgLogo, OrgAboutUsDTO orgAboutUs, OrgDirectorDetailDTO orgDirectorDetail,
			OrgAchievementDTO orgAchievement, OrgGallery orgGallery) {
		super();
		this.id = id;
		this.orgName = orgName;
		this.orgAddress = orgAddress;
		this.orgPhone = orgPhone;
		this.orgEmail = orgEmail;
		this.orgLogo = orgLogo;
		this.orgAboutUs = orgAboutUs;
		this.orgDirectorDetail = orgDirectorDetail;
		this.orgAchievement = orgAchievement;
		this.orgGallery = orgGallery;
	}	    
}
