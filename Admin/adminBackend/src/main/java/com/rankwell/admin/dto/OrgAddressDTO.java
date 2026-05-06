package com.rankwell.admin.dto;

public class OrgAddressDTO {
    private String label;
    private String address;

    public OrgAddressDTO() {}

    public OrgAddressDTO(String label, String address) {
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

