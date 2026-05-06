package com.rankwell.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class OrgAddressEntry {

    @Column(name = "label")
    private String label;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    public OrgAddressEntry() {}

    public OrgAddressEntry(String label, String address) {
        this.label = label;
        this.address = address;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}

