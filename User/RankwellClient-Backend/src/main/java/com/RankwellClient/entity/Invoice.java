package com.RankwellClient.entity;

import java.time.LocalDateTime;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;


@Entity
public class Invoice {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id; 
	
	@Column(unique = true)
	private String invoiceNumber;
	private String invoiceId;
	private LocalDateTime invoiceDate;
	private Long totalAmount;  //amount + tax
	private Long taxAmount;
	private String billingAddress;
	private Long invoiceDiscount;
	private Long invoiceTaxRate;

	// Snapshot of what was purchased (subscription plan) at invoice generation time.
	@Column(name = "item_kind", length = 32)
	private String itemKind;

	@Column(name = "item_name", length = 255)
	private String itemName;

	@Column(name = "item_currency", length = 8)
	private String itemCurrency;

	@Column(name = "item_duration_days")
	private Integer itemDurationDays;

	@Column(name = "item_storage_limit_mb")
	private Integer itemStorageLimitMb;

	// Stored in rupees (integer rounding for invoice display consistency)
	@Column(name = "item_unit_price")
	private Long itemUnitPrice;

	// Snapshot of invoicing profile (seller details) at generation time.
	@Column(name = "seller_company_name", length = 255)
	private String sellerCompanyName;

	@Column(name = "seller_company_address", length = 2000)
	private String sellerCompanyAddress;

	@Column(name = "seller_company_logo_path", length = 2000)
	private String sellerCompanyLogoPath;

	@Column(name = "seller_company_gst_no", length = 64)
	private String sellerCompanyGSTNo;
	
	@ManyToOne
	@JoinColumn(name = "user_id")
	private Users users;
	
	@ManyToOne
	@JoinColumn(name = "payment_id")
	private Payment payment;

//	@ManyToMany
//	@JoinTable(name = "invoice_course", joinColumns = @JoinColumn(name = "invoice_id"), inverseJoinColumns = @JoinColumn(name = "course_id"))
//	private List<Courses> courses;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getInvoiceNumber() {
		return invoiceNumber;
	}

	public void setInvoiceNumber(String invoiceNumber) {
		this.invoiceNumber = invoiceNumber;
	}

	public String getInvoiceId() {
		return invoiceId;
	}

	public void setInvoiceId(String invoiceId) {
		this.invoiceId = invoiceId;
	}

	public LocalDateTime getInvoiceDate() {
		return invoiceDate;
	}

	public void setInvoiceDate(LocalDateTime invoiceDate) {
		this.invoiceDate = invoiceDate;
	}
	public String getBillingAddress() {
		return billingAddress;
	}

	public void setBillingAddress(String billingAddress) {
		this.billingAddress = billingAddress;
	}

	 public Long getInvoiceDiscount() {
		return invoiceDiscount;
	}

	public void setInvoiceDiscount(Long invoiceDiscount) {
		this.invoiceDiscount = invoiceDiscount;
	}

	public Long getInvoiceTaxRate() {
		return invoiceTaxRate;
	}

	public void setInvoiceTaxRate(Long invoiceTaxRate) {
		this.invoiceTaxRate = invoiceTaxRate;
	}

	public String getItemKind() {
		return itemKind;
	}

	public void setItemKind(String itemKind) {
		this.itemKind = itemKind;
	}

	public String getItemName() {
		return itemName;
	}

	public void setItemName(String itemName) {
		this.itemName = itemName;
	}

	public String getItemCurrency() {
		return itemCurrency;
	}

	public void setItemCurrency(String itemCurrency) {
		this.itemCurrency = itemCurrency;
	}

	public Integer getItemDurationDays() {
		return itemDurationDays;
	}

	public void setItemDurationDays(Integer itemDurationDays) {
		this.itemDurationDays = itemDurationDays;
	}

	public Integer getItemStorageLimitMb() {
		return itemStorageLimitMb;
	}

	public void setItemStorageLimitMb(Integer itemStorageLimitMb) {
		this.itemStorageLimitMb = itemStorageLimitMb;
	}

	public Long getItemUnitPrice() {
		return itemUnitPrice;
	}

	public void setItemUnitPrice(Long itemUnitPrice) {
		this.itemUnitPrice = itemUnitPrice;
	}

	public String getSellerCompanyName() {
		return sellerCompanyName;
	}

	public void setSellerCompanyName(String sellerCompanyName) {
		this.sellerCompanyName = sellerCompanyName;
	}

	public String getSellerCompanyAddress() {
		return sellerCompanyAddress;
	}

	public void setSellerCompanyAddress(String sellerCompanyAddress) {
		this.sellerCompanyAddress = sellerCompanyAddress;
	}

	public String getSellerCompanyLogoPath() {
		return sellerCompanyLogoPath;
	}

	public void setSellerCompanyLogoPath(String sellerCompanyLogoPath) {
		this.sellerCompanyLogoPath = sellerCompanyLogoPath;
	}

	public String getSellerCompanyGSTNo() {
		return sellerCompanyGSTNo;
	}

	public void setSellerCompanyGSTNo(String sellerCompanyGSTNo) {
		this.sellerCompanyGSTNo = sellerCompanyGSTNo;
	}

	public Users getUsers() {
		return users;
	}

	public void setUsers(Users users) {
		this.users = users;
	}

	public Payment getPayment() {
		return payment;
	}

	public void setPayment(Payment payment) {
		this.payment = payment;
	}
	public Long getTotalAmount() {
		return totalAmount;
	}

	public void setTotalAmount(Long totalAmount) {
		this.totalAmount = totalAmount;
	}

	public Long getTaxAmount() {
		return taxAmount;
	}

	public void setTaxAmount(Long taxAmount) {
		this.taxAmount = taxAmount;
	}

//	public List<Courses> getCourses() {
//		return courses;
//	}
//	public void setCourses(List<Courses> courses) {
//		this.courses = courses;
//	}

	public Invoice() {
		super();
		// TODO Auto-generated constructor stub
	}

	public Invoice(Long id, String invoiceNumber, String invoiceId, LocalDateTime invoiceDate, Long totalAmount, Long taxAmount,
			String billingAddress,Long invoiceDiscount, Long invoiceTaxRate, Users users, Payment payment) {
		super();
		this.id = id;
		this.invoiceNumber = invoiceNumber;
		this.invoiceDate = invoiceDate;
		this.totalAmount = totalAmount;
		this.taxAmount = taxAmount;
		this.billingAddress = billingAddress;
		this.users = users;
		this.payment = payment;
		this.invoiceId = invoiceId;
		this.invoiceDiscount = invoiceDiscount;
		this.invoiceTaxRate = invoiceTaxRate;
	}
	
	

}
