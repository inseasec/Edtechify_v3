package com.rankwell.admin.entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table
public class OrgTeamGallery {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Lob
	@Column(columnDefinition = "TEXT")
	private String teamSectionTitle;

	@ElementCollection
	@CollectionTable(name = "team_gallery_images", joinColumns = @JoinColumn(name = "team_gallery_id"))
	@Column(name = "image_path")
	private List<String> teamImages = new ArrayList<>();

	@OneToOne
	@JoinColumn(name = "organization_id", nullable = false)
	@JsonBackReference
	private OrganizationDetail organization;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getTeamSectionTitle() {
		return teamSectionTitle;
	}

	public void setTeamSectionTitle(String teamSectionTitle) {
		this.teamSectionTitle = teamSectionTitle;
	}

	public List<String> getTeamImages() {
		return teamImages;
	}

	public void setTeamImages(List<String> teamImages) {
		this.teamImages = teamImages;
	}

	public OrganizationDetail getOrganization() {
		return organization;
	}

	public void setOrganization(OrganizationDetail organization) {
		this.organization = organization;
	}

	public OrgTeamGallery() {
		super();
	}
}
