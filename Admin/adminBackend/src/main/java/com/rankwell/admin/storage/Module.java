package com.rankwell.admin.storage;

public enum Module { 

    ABOUT_US("AboutUs"),
    GALLERY("Gallery"),
    /** Team/office photos (About “Our Team”, not product gallery). */
    TEAM("Team"),
    HOME_PAGE("HomePage");

    private final String folder;

    Module(String folder) {
        this.folder = folder;  
    }

    public String getFolder() {  
        return folder;
    }
} 
 