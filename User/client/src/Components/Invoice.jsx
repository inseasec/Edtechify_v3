import React, { useEffect, useState } from 'react';
import html2pdf from 'html2pdf.js';

const Invoice = ({ invoice, onClose, orgData, invoiceSettings, autoDownload = false }) => {
  const adminApiBaseUrl = window._CONFIG_.VITE_ADMIN_PROJECT_URL;

  const timestamp = invoice.invoiceDate;

  const date = timestamp.slice(0, 10);
  const [y, m, d] = date.split('-');
  const formattedDate = `${d}/${m}/${y}`;

  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(invoice.invoiceTaxRate);

  const formatDurationDays = (days) => {
    const dNum = Number(days);
    if (!Number.isFinite(dNum) || dNum < 1) return "—";
    return `${dNum} day${dNum === 1 ? "" : "s"}`;
  };

  const unitPrice = Number(invoice?.itemUnitPrice ?? 0);
  const safeUnitPrice = Number.isFinite(unitPrice) ? unitPrice : 0;
  const safeTaxRate = Number.isFinite(Number(taxRate)) ? Number(taxRate) : 0;
  const taxAmount = Math.round((safeUnitPrice * safeTaxRate) / 100);
  const totalIncludingTax = safeUnitPrice + taxAmount;
  const safeDiscount = 0;
  const amountComputed = totalIncludingTax;
  const amountPaid = Math.round(Number(invoice?.payment?.amount ?? 0) / 100);
  const amountToShow = Number.isFinite(amountPaid) && amountPaid > 0 ? amountPaid : amountComputed;

  const [invoiceData, setInvoiceData] = useState({
    companyName:
      invoice?.sellerCompanyName ||
      invoiceSettings?.invoice_company_name ||
      invoiceSettings?.invoiceCompanyName ||
      orgData?.orgName,
    companyAddress:
      invoice?.sellerCompanyAddress ||
      invoiceSettings?.invoice_company_address ||
      invoiceSettings?.invoiceCompanyAddress ||
      orgData?.orgAddress,

    billToName: invoice.payment.user.userName,
    billToPhone: invoice.payment.user.mobileNo,
    billToAddress: invoice.payment.user.streetAddress,
    billToCity: invoice.payment.user.city,
    billToPincode: invoice.payment.user.postalCode,

    invoiceGST:
      invoice?.sellerCompanyGSTNo ||
      invoiceSettings?.invoice_company_gst_no ||
      invoiceSettings?.invoiceCompanyGSTNo ||
      invoiceSettings?.invoicegst,
    invoiceId: invoice.invoiceId?.replace(/\s+/g, ""),
    invoiceDate: formattedDate,
  });

  // const getInvoiceData = async () => {
  //   try {
  //     const response = await axios.get(`${adminApiBaseUrl}/invoiceSettings/getInvoiceValues`, {
  //       headers: token ? { Authorization: `Bearer ${token}` } : {},
  //     });
  //     setInvoiceData(prev => ({
  //       ...prev,
  //       invoiceGST: response.data.invoiceGST || prev.invoiceGST,
  //     }));
  //   } catch (error) {
  //     console.error('Error Fetching from API:', error);
  //   }
  // };

  // useEffect(() => {
  //   getInvoiceData();
  // }, []);

  useEffect(() => {
    if (orgData) {
      setInvoiceData(prev => ({
        ...prev,
        companyName:
          invoice?.sellerCompanyName ||
          invoiceSettings?.invoice_company_name ||
          invoiceSettings?.invoiceCompanyName ||
          orgData?.orgName,
        companyAddress:
          invoice?.sellerCompanyAddress ||
          invoiceSettings?.invoice_company_address ||
          invoiceSettings?.invoiceCompanyAddress ||
          orgData?.orgAddress,
      }));
    }
  }, [orgData, invoiceSettings, invoice]);

  const totals = {
    total: safeUnitPrice,
    taxAmount,
    subtotal: totalIncludingTax,
    discount: safeDiscount,
    amount: amountToShow,
  };
  const downloadInvoice = () => {
    const element = document.getElementById('invoice');

    if (!element) {
      console.error("Invoice element not found");
      return;
    }

    // Clone the element
    const cloneElement = element.cloneNode(true);

    // Add a style block to the clone that overrides all oklch colors
    const styleBlock = document.createElement('style');
    styleBlock.textContent = `
    * {
      color: #000000 !important;
      background-color: #ffffff !important;
      border-color: #e5e7eb !important;
    }
    .text-green-600 {
      color: #16a34a !important;
    }
    .text-red-600 {
      color: #dc2626 !important;
    }
    .bg-gray-50 {
      background-color: #f9fafb !important;
    }
    .bg-gray-100 {
      background-color: #f3f4f6 !important;
    }
    img {
      display: inline-block !important;
      max-width: 100% !important;
    }
  `;
    cloneElement.prepend(styleBlock);

    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.appendChild(cloneElement);
    document.body.appendChild(tempDiv);

    // Generate PDF
    html2pdf()
      .from(cloneElement)
      .set({
        margin: 0.5,
        filename: `invoice_${invoiceData.invoiceId || 'download'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      })
      .save()
      .then(() => {
        document.body.removeChild(tempDiv);
      })
      .catch((error) => {
        console.error("PDF Error:", error);
        document.body.removeChild(tempDiv);
        alert("Error generating PDF. Please try again.");
      });
  };

  useEffect(() => {
    if (!autoDownload) return;
    // wait for modal DOM to paint before html2pdf reads it
    const t = setTimeout(() => {
      try {
        downloadInvoice();
      } finally {
        onClose?.();
      }
    }, 250);
    return () => clearTimeout(t);
  }, [autoDownload]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 text-black">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <button
            type="button"
            onClick={downloadInvoice}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Download Invoice
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto p-6">

          {/* Invoice Body */}
          <div className="border rounded-lg p-6 bg-gray-50 text-black" id="invoice">

            <p className="text-2xl font-black mb-4 text-center text-black">
              Invoice
            </p>

            <hr className='py-2' />

            {/* Company Header */}
            <div className="flex relative gap-[4%] items-start mb-6">

              <div className='w-[40%] text-left'>
                <img
                  src={`${adminApiBaseUrl}/${(invoice?.sellerCompanyLogoPath || invoiceSettings?.invoice_company_logo_path || invoiceSettings?.invoiceCompanyLogoPath || orgData?.orgLogo || "").replace(/^\/+/, "")}`}
                  alt="Company Logo"
                  className="w-32 h-32 object-contain mb-2"
                />
              </div>

              <div className='w-[40%]'>
                <h3 className="font-bold text-xl">{invoiceData?.companyName}</h3>
                <p className="text-sm text-black">{invoiceData?.companyAddress}</p>
              </div>

              <div className='absolute right-1 bottom-0'>
                <p className="text-sm text-black">
                  <span className='font-bold mr-1'>GST No.:</span>
                  {invoiceData?.invoiceGST}
                </p>
              </div>

            </div>

            <hr className='my-4' />

            {/* Bill To */}
            <div className="flex justify-between mb-6">

              <div className='flex gap-2'>
                <h4 className="font-semibold">Bill To:</h4>
                <div>
                  <p className="font-medium">{invoiceData.billToName}</p>
                  <p className="text-sm">{invoiceData.billToPhone}</p>
                  <p className="text-sm">{invoiceData.billToAddress}</p>
                  <p className="text-sm">
                    {invoiceData.billToCity} - {invoiceData.billToPincode}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm">
                  <span className='font-bold'>Invoice Id:</span>{" "}
                  {invoiceData.invoiceId}
                </p>
                <p className="text-sm">
                  <span className='font-bold'>Invoice Date:</span>{" "}
                  {invoiceData.invoiceDate}
                </p>
              </div>

            </div>

            {/* Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-sm font-semibold text-black border">Plan</th>
                  <th className="py-3 px-4 text-sm font-semibold text-black border">Duration</th>
                  <th className="py-3 px-4 text-sm font-semibold text-black border">Unit price</th>
                </tr>
              </thead>

              <tbody>
                <tr className="bg-gray-50">
                  <td className="py-2 px-4 text-sm border">{invoice?.itemName || "Subscription"}</td>
                  <td className="py-2 px-4 text-sm border">
                    {invoice?.itemDurationDays != null ? formatDurationDays(invoice.itemDurationDays) : "—"}
                    {invoice?.itemStorageLimitMb != null ? ` · ${invoice.itemStorageLimitMb} MB` : ""}
                  </td>
                  <td className="py-2 px-4 text-sm border">₹{totals.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-4 flex flex-col items-end">
              <div className="w-64 space-y-2 text-sm">

                <div className="flex justify-between">
                  <span className="font-medium">Sub Total:</span>
                  <span>₹{totals.total.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">GST:</span>
                  <span className='text-green-600'>{taxRate}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Total (Including GST):</span>
                  <span>₹{totals.subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Amount:</span>
                  <span className="font-semibold">
                    ₹{totals.amount.toLocaleString()}
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;