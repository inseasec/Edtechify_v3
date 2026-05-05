package com.RankwellClient.ServiceImpl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.time.Year;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.RankwellClient.entity.InvoiceSettings;
import com.RankwellClient.repository.InvoiceSettingsRepository;
import com.RankwellClient.entity.Invoice;
import com.RankwellClient.entity.Payment;
import com.RankwellClient.entity.SubscriptionPlan;
import com.RankwellClient.repository.InvoiceRepository;
import com.RankwellClient.repository.SubscriptionPlanRepository;
import com.RankwellClient.services.InvoiceService;
import java.util.List;
import java.util.Map;

@Service
public class InvoiceServiceImpl implements InvoiceService{
	
	 @Autowired
	 private InvoiceRepository invoiceRepository;

//	 @Autowired
//	 private CourseRepository courseRepository;;

	 @Autowired
	 private InvoiceSettingsRepository invoiceSettingsRepository;;

	 @Autowired
	 private SubscriptionPlanRepository subscriptionPlanRepository;

	    public Invoice generateInvoice(Payment payment) { 
	        Invoice invoice = new Invoice();
	        invoice.setInvoiceNumber(payment.getPaymentId() +" "+ payment.getOrderId()); // invoice no. will be auto generated as the combination of paymentId + orderId
	        invoice.setInvoiceDate(LocalDateTime.now());
	        // Long totalAmount = payment.getAmount(); // in paise 
			Long paidAmount = Math.round(payment.getAmount() / 100.0); // in rupee (what customer paid)
			System.out.println("₹" + paidAmount);
	        
	        // double taxRate = 0.18; // No hard coded
	        
	        // Calculate tax in rupee
	        // Long taxAmount = Math.round(totalAmount * taxRate / (1 + taxRate));		
	        // invoice.setTaxAmount(taxAmount);

	        invoice.setTotalAmount(paidAmount);
	        invoice.setUsers(payment.getUser());
	        invoice.setPayment(payment);
			// invoice.setCourses(payment.getCourses()); // Set Courses in invoice column list

//			if(payment.getCourses() != null){
//				invoice.setCourses(new ArrayList<>(payment.getCourses()));
//			}

			// == new added chnages here ===//

			// if (payment.getCourses() != null && !payment.getCourses().isEmpty()) {

			// 	List<Long> courseIds = payment.getCourses()
			// 			.stream()
			// 			.map(Courses::getId)
			// 			.toList();

			// 	// Fetch FULL objects from DB
			// 	List<Courses> fullCourses = courseRepository.findAllById(courseIds);

			// 	// Now set properly
			// 	invoice.setCourses(fullCourses);
			// }


	        // return invoiceRepository.save(invoice);

			// Ensure invoice settings exist + defaults are present even when admin leaves fields blank.
			InvoiceSettings settingsRow = invoiceSettingsRepository.findTopByOrderByIdDesc();
			boolean settingsDirty = false;
			if (settingsRow == null) {
				settingsRow = new InvoiceSettings();
				settingsDirty = true;
			}

			String prefixSafe = settingsRow.getInvoicePrefix() != null ? settingsRow.getInvoicePrefix().trim() : "";
			if (prefixSafe.isEmpty()) {
				settingsRow.setInvoicePrefix("INV");
				settingsDirty = true;
			}

			String yearSafe = settingsRow.getInvoiceYear() != null ? settingsRow.getInvoiceYear().trim() : "";
			if (yearSafe.isEmpty()) {
				settingsRow.setInvoiceYear(String.valueOf(Year.now().getValue())); // e.g. 2026
				settingsDirty = true;
			}

			String suffixSafe = settingsRow.getInvoiceSuffix() != null ? settingsRow.getInvoiceSuffix().trim() : "";
			if (suffixSafe.isEmpty()) {
				settingsRow.setInvoiceSuffix("001");
				settingsDirty = true;
			}

			if (settingsRow.getInvoiceDiscount() == null) {
				settingsRow.setInvoiceDiscount(0L);
				settingsDirty = true;
			}
			if (settingsRow.getInvoiceTaxRate() == null) {
				settingsRow.setInvoiceTaxRate(0L);
				settingsDirty = true;
			}

			if (settingsDirty) {
				invoiceSettingsRepository.save(settingsRow);
			}

			Map<String, Object> invoiceValues = invoiceRepository.getInvoiceSettings();

			// Calculate tax in rupee

			Object invTaxRateValue = invoiceValues.get("invoiceTaxRate");
			Long invoiceTaxRate = invTaxRateValue != null ? ((Number) invTaxRateValue).longValue() : 0L;

			invoice.setInvoiceTaxRate(invoiceTaxRate); // set current GST rate

			// Discount is not supported as a global setting anymore.
			invoice.setInvoiceDiscount(0L);

			// Snapshot seller/invoicing profile at generation time so old invoices never change.
			// Keys come from DB column names (snake_case) because InvoiceRepository.getInvoiceSettings() uses SELECT *.
			Object sellerNameObj = invoiceValues.get("invoice_company_name");
			Object sellerAddrObj = invoiceValues.get("invoice_company_address");
			Object sellerLogoObj = invoiceValues.get("invoice_company_logo_path");
			Object sellerGstObj = invoiceValues.get("invoice_company_gst_no");
			invoice.setSellerCompanyName(sellerNameObj != null ? String.valueOf(sellerNameObj) : null);
			invoice.setSellerCompanyAddress(sellerAddrObj != null ? String.valueOf(sellerAddrObj) : null);
			invoice.setSellerCompanyLogoPath(sellerLogoObj != null ? String.valueOf(sellerLogoObj) : null);
			invoice.setSellerCompanyGSTNo(sellerGstObj != null ? String.valueOf(sellerGstObj) : null);

			// Long invoiceTaxRate = invoiceValues.get("invoice_tax_rate"); // 18% -> 0.18 
	        // Long taxAmount = Math.round(totalAmount * invoiceTaxRate / (1 + invoiceTaxRate));	

			// Compute tax portion from the paid amount (which includes tax) using: tax = gross * r / (100 + r)
			if (invoiceTaxRate != null && invoiceTaxRate > 0 && paidAmount != null) {
				double taxPortion = paidAmount * invoiceTaxRate / (100.0 + invoiceTaxRate);
				Long taxAmount = Math.round(taxPortion);
				invoice.setTaxAmount(taxAmount);
			} else {
				invoice.setTaxAmount(0L);
			}

			// Snapshot subscription plan details for invoice line-item (if this payment was for a plan)
			if (payment.getSubscriptionPlanId() != null) {
				SubscriptionPlan plan = subscriptionPlanRepository.findById(payment.getSubscriptionPlanId()).orElse(null);
				if (plan != null) {
					invoice.setItemKind("SUBSCRIPTION");
					invoice.setItemName(plan.getName());
					invoice.setItemCurrency(plan.getCurrency());
					invoice.setItemDurationDays(plan.getDurationDays());
					invoice.setItemStorageLimitMb(plan.getStorageLimitMb());
					// Store in rupees as integer for invoice display
					if (plan.getPrice() != null) {
						invoice.setItemUnitPrice(Math.round(plan.getPrice().doubleValue()));
					}
				}
			}

			// InvoiceId set
			String prefix = invoiceValues.get("invoice_prefix") != null ? String.valueOf(invoiceValues.get("invoice_prefix")).trim() : "";
			String year = invoiceValues.get("invoice_year") != null ? String.valueOf(invoiceValues.get("invoice_year")).trim() : "";
			String suffix = invoiceValues.get("invoice_suffix") != null ? String.valueOf(invoiceValues.get("invoice_suffix")).trim() : "";

			if (prefix.isEmpty()) prefix = "INV";
			if (year.isEmpty()) year = String.valueOf(Year.now().getValue());
			if (suffix.isEmpty()) suffix = "001";

			// === exsisting working code == //
			
			// String generateInvoiceId = "";
			// Invoice lastInvoice = invoiceRepository.findTopByOrderByInvoiceDateDescIdDesc().orElse(null);


			// 	InvoiceSettings settings = invoiceSettingsRepository.findTopByOrderByIdDesc();

    		// 	Boolean updateSerialNo = settings != null && Boolean.TRUE.equals(settings.getUpdateSerialNo());


			// if (lastInvoice == null || updateSerialNo) {

			// 	generateInvoiceId = prefix + "/" + year + "/" + suffix;

			// 	// 🔥 IMPORTANT → reset flag after use
			// 	if (settings != null && Boolean.TRUE.equals(settings.getUpdateSerialNo())) {
			// 		settings.setUpdateSerialNo(false);
			// 		invoiceSettingsRepository.save(settings);
			// 	}

			// } else {
			// 	// your existing increment logic
			// // }

			// // if (lastInvoice == null) {
			// // 	// ✅ First invoice → use admin-defined suffix
			// // 	generateInvoiceId  = prefix + "/" + year + "/" + suffix; // ABC/25-26/123
			// // } else {
			// 	// ✅ Get last invoiceId						
			// 	String lastInvoiceId = lastInvoice.getInvoiceId();

			// 	String prefixPart;
			// 	String suffixPart;

			// 	// ✅ Handle BOTH formats (old + new)
			// 	if (lastInvoiceId.contains("/")) {

			// 		String[] parts = lastInvoiceId.split("/");

			// 		if (parts.length < 3) {
			// 			throw new RuntimeException("Invalid invoice format: " + lastInvoiceId);
			// 		}

			// 		prefixPart = parts[0];   // ABC
			// 		suffixPart = parts[2];   // 00123

			// 	} else {

			// 		// Old format (RNK126, TEST00045)
			// 		prefixPart = lastInvoiceId.replaceAll("[0-9]", "");   // RNK
			// 		suffixPart = lastInvoiceId.replaceAll("[^0-9]", "");  // 00045
			// 	}

			// 	// 🔥 Safety check
			// 	if (suffixPart == null || suffixPart.isEmpty()) {
			// 		throw new RuntimeException("Invalid invoice suffix: " + lastInvoiceId);
			// 	}

			// 	// 🔹 Increment suffix
			// 	int length = suffixPart.length();
			// 	int nextNumber = Integer.parseInt(suffixPart) + 1;

			// 	String newSuffix = String.format("%0" + length + "d", nextNumber);

			// 	// 🔹 Build final invoice ID
			// 	generateInvoiceId = prefix + "/" + year + "/" + newSuffix;

			// }

			// invoice.setInvoiceId(generateInvoiceId);
			// return invoiceRepository.save(invoice);

			// == above exsisting working code == //

			// ✅ Get last invoiceId						
			// String lastInvoiceId = lastInvoice.getInvoiceId();
			InvoiceSettings settings = invoiceSettingsRepository.findTopByOrderByIdDesc();
			Invoice lastInvoice = invoiceRepository.findTopByOrderByInvoiceDateDescIdDesc().orElse(null);
			Boolean updateSerialNo = settings != null && settings.getUpdateSerialNo();
			

			String generateInvoiceId = "";

			String lastInvoiceId = lastInvoice != null ? lastInvoice.getInvoiceId() : null;

			if (updateSerialNo) {
				// 🔥 RESET CASE
				generateInvoiceId = prefix + "/" + year + "/" + suffix;

				// reset flag after use
				if (settings != null) {
					settings.setUpdateSerialNo(false);
					invoiceSettingsRepository.save(settings);
				}

			} else if (lastInvoiceId == null) {
				// 🆕 FIRST INVOICE
				generateInvoiceId = prefix + "/" + year + "/" + suffix;

			} else {
				// 🔁 CONTINUE SERIES

				String prefixPart;
				String suffixPart;

				if (lastInvoiceId.contains("/")) {
					String[] parts = lastInvoiceId.split("/");

					prefixPart = parts[0];
					suffixPart = parts[2];

				} else {
					// old format
					prefixPart = lastInvoiceId.replaceAll("[0-9]", "");
					suffixPart = lastInvoiceId.replaceAll("[^0-9]", "");
				}

				if (suffixPart == null || suffixPart.isEmpty()) {
					throw new RuntimeException("Invalid invoice suffix: " + lastInvoiceId);
				}

				int length = suffixPart.length();
				int nextNumber = Integer.parseInt(suffixPart) + 1;

				String newSuffix = String.format("%0" + length + "d", nextNumber);

				generateInvoiceId = prefix + "/" + year + "/" + newSuffix;
			}

			invoice.setInvoiceId(generateInvoiceId);
			 return invoiceRepository.save(invoice);

	    }

	@Override
	public List<Invoice> getInvoiceByUserId(Long userId){
		List<Invoice> invoice = invoiceRepository.findByUsersIdOrderByInvoiceDateDescIdDesc(userId);
		return invoice;
	 }

}
