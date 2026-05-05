package com.rankwell.admin.controllers;

import java.security.Principal;
import java.io.File;
import java.io.IOException;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.rankwell.admin.entity.InvoiceSettings;
import com.rankwell.admin.config.StoragePathResolver;
import com.rankwell.admin.services.InvoiceSettingsService;

@RestController 
@RequestMapping("/invoiceSettings")
public class InvoiceSettingsController { 

	@Autowired
	public InvoiceSettingsService invoiceSettingsService;

	@Autowired
	private StoragePathResolver storagePathResolver;
	
	@PostMapping("/setInvoiceValues")
	public InvoiceSettings saveOrUpdateInvoiceValues(@RequestBody InvoiceSettings invoiceSettings, Principal principal) {
		return invoiceSettingsService.saveOrUpdateInvoiceValues(invoiceSettings, principal.getName());
	}

    @GetMapping("/getInvoiceValues")
	public InvoiceSettings getInvoiceValues(Principal principal) {
		return invoiceSettingsService.getInvoiceValues(principal.getName());
	}

	@PostMapping("/setUpdateNewSerialNo")
	public InvoiceSettings saveOrUpdateNewSerialNo(@RequestBody InvoiceSettings invoiceSettings, Principal principal) {
		return invoiceSettingsService.saveOrUpdateNewSerialNo(invoiceSettings, principal.getName());
	}

	@PostMapping("/uploadInvoiceLogo")
	public ResponseEntity<String> uploadInvoiceLogo(@RequestParam("logo") MultipartFile logo) throws IOException {
		if (logo == null || logo.isEmpty()) {
			return ResponseEntity.badRequest().body("Logo file is empty.");
		}

		String basePath = storagePathResolver.getBasePath();
		String relativeDir = "OrgData/Invoicing/Image";
		File dir = new File(basePath, relativeDir);
		if (!dir.exists() && !dir.mkdirs()) {
			return ResponseEntity.internalServerError().body("Failed to create directory: " + dir.getAbsolutePath());
		}

		String originalName = logo.getOriginalFilename();
		String extension = "";
		if (originalName != null && originalName.contains(".")) {
			extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
		}

		String fileName = "invoice_logo_" + UUID.randomUUID() + extension;
		File destination = new File(dir, fileName);
		logo.transferTo(destination);

		return ResponseEntity.ok(relativeDir + "/" + fileName);
	}

}