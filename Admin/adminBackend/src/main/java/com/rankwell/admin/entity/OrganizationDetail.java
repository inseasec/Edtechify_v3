package com.rankwell.admin.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.Map;
import java.util.List;
import com.rankwell.admin.entity.OrgAddressEntry;


@Entity
@Table
public class OrganizationDetail {                 
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(unique = true, nullable = false)
	private String orgName;
	
	private String orgAddress;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "organization_addresses", joinColumns = @JoinColumn(name = "organization_id"))
	private List<OrgAddressEntry> orgAddresses;
	
	private String orgPhone;
	
	private String orgEmail;
	 
	private String orgLogo;

	/**
	 * JSON array of public nav paths to hide (e.g. ["/gallery"]). Keys must be in
	 * {@link com.rankwell.admin.util.NavBarConfigurablePaths#ALLOWED}.
	 */
	@Column(name = "navbar_hidden_paths_json", columnDefinition = "TEXT")
	private String navbarHiddenPathsJson;

	
 //  Manage JSON serialization (parent → child only)
    @OneToOne(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.EAGER) 
    @JsonManagedReference
    private OrgAboutUs orgAboutUs;

    @OneToOne(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.EAGER) 
    @JsonManagedReference
    private OrgDirectorDetail orgDirectorDetail;

    @OneToOne(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private OrgAchievement orgAchievement;
    
    @OneToOne(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.EAGER) 
    @JsonManagedReference
    private  OrgGallery orgGallery;

    @OneToOne(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private OrgTeamGallery orgTeamGallery;

    @OneToOne(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private OrgParentCompany orgParentCompany;

	@OneToOne(mappedBy = "organization", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private OrgHome orgHome; 


    // Getter Setter  //

   public OrgHome getOrgHome(){ 
       return orgHome;
    }  

    public void setOrgHome(OrgHome orgHome){ 
      this.orgHome = orgHome;
    }
    
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

	public List<OrgAddressEntry> getOrgAddresses() {
		return orgAddresses;
	}

	public void setOrgAddresses(List<OrgAddressEntry> orgAddresses) {
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

	public String getNavbarHiddenPathsJson() {
		return navbarHiddenPathsJson;
	}

	public void setNavbarHiddenPathsJson(String navbarHiddenPathsJson) {
		this.navbarHiddenPathsJson = navbarHiddenPathsJson;
	}

	public OrgAboutUs getOrgAboutUs() {
		return orgAboutUs;
	}

	public void setOrgAboutUs(OrgAboutUs orgAboutUs) {
		this.orgAboutUs = orgAboutUs;
	}

	public OrgDirectorDetail getOrgDirectorDetail() {
		return orgDirectorDetail;
	}

	public void setOrgDirectorDetail(OrgDirectorDetail orgDirectorDetail) {
		this.orgDirectorDetail = orgDirectorDetail;
	}

	public OrgAchievement getOrgAchievement() {
		return orgAchievement;
	}

	public void setOrgAchievement(OrgAchievement orgAchievement) {
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

    public OrgParentCompany getOrgParentCompany() {
        return orgParentCompany;
    }

    public void setOrgParentCompany(OrgParentCompany orgParentCompany) {
        this.orgParentCompany = orgParentCompany;
    }

	public OrganizationDetail() {
		super();
		// TODO Auto-generated constructor stub
	}

	public OrganizationDetail(Long id, String orgName, String orgAddress, String orgPhone, String orgEmail,
			String orgLogo, OrgAboutUs orgAboutUs, OrgDirectorDetail orgDirectorDetail, OrgAchievement orgAchievement,
			OrgGallery orgGallery) {
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
