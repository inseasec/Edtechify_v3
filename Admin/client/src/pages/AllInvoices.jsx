import api from '@/lib/api'
import React, { useEffect, useState } from 'react'
import Invoice from './Invoice'
import axios from 'axios'

const BillingInvoices = () => {
  const baseUrl = window._CONFIG_.VITE_API_BASE_URL;
  const [invoices, setInvoices] = useState([])
  const [orgData, setOrgData] = useState(null)
  const [clientCompanyByUserId, setClientCompanyByUserId] = useState({})
  const [searchResults, setSearchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [invoiceData, setInvoiceData] = useState(null)
  const [autoDownload, setAutoDownload] = useState(false)

  const InvoiceInfo = async () => {
    try {
      const response = await api.get(`/invoice/getAllInvoices`)
      setInvoices(response.data ?? [])
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchOrgData = async () => {
    try {
      const res = await api.get(`/organizations/details`)
      const data = res.data
      setOrgData({
        orgName: data.orgName || '',
        orgAddress: data.orgAddress || '',
        orgPhone: data.orgPhone || '',
        orgEmail: data.orgEmail || '',
        orgLogo: data.orgLogo || null,
      })
    } catch (error) {
      console.error('error fetching orgdata:', error)
    }
  }

  const fetchClientCompanies = async () => {
    try {
      const res = await api.get('/clients/portal-rows')
      const rows = Array.isArray(res.data) ? res.data : []
      const map = {}
      for (const r of rows) {
        const uid = r?.userId
        const name = r?.companyName
        if (uid != null && name) map[String(uid)] = String(name)
      }
      setClientCompanyByUserId(map)
    } catch (error) {
      console.error('error fetching client portal rows:', error)
      setClientCompanyByUserId({})
    }
  }

  useEffect(() => {
    fetchOrgData()
    InvoiceInfo()
    fetchClientCompanies()
  }, [])
 
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults(invoices)
      return
    }

    const q = searchTerm.toLowerCase()
    const Filtered = invoices.filter((item) => {
      try {
        // Match the columns actually shown in the table: Invoice Id, Invoice
        // Date, Plan, Customer Name, Login Mobile. We test both the raw ISO
        // date and the DD/MM/YYYY display so users can type "13/05" or
        // "2026-05" alike. Mobile is normalized so trailing/leading spaces or
        // a leading "+" / country code don't break partial searches.
        const invId = String(item.invoiceId ?? '')
        const planName = String(item?.itemName ?? '')
        const customerName =
          clientCompanyByUserId[String(item?.users?.id)] ||
          item?.users?.userName ||
          ''
        const invDateIso = String(item?.invoiceDate ?? '').slice(0, 10)
        const invDateDisplay = formattedDate(item?.invoiceDate)
        const mobile = String(item?.users?.mobileNo ?? '')
        const mobileDigits = mobile.replace(/\D+/g, '')
        const qDigits = q.replace(/\D+/g, '')

        return (
          invId.toLowerCase().includes(q) ||
          planName.toLowerCase().includes(q) ||
          customerName.toLowerCase().includes(q) ||
          invDateIso.toLowerCase().includes(q) ||
          invDateDisplay.toLowerCase().includes(q) ||
          mobile.toLowerCase().includes(q) ||
          (qDigits.length > 0 && mobileDigits.includes(qDigits))
        )
      } catch {
        return false
      }
    })
    setSearchResults(Filtered)
  }, [searchTerm, invoices, clientCompanyByUserId])

  const formattedDate = (datestr) => {
    if (!datestr) return ''
    const date = datestr.slice(0, 10)
    const [y, m, d] = date.split('-')
    if (!y || !m || !d) return datestr
    return `${d}/${m}/${y}`
  }

  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(searchResults.length / itemsPerPage))

  const startIndex = (currentPage - 1) * itemsPerPage
  const Results = searchResults.slice(startIndex, startIndex + itemsPerPage)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="mx-auto max-w-[97%] min-h-screen p-2">
      <div className="mb-4 mt-10 flex gap-10">
        <h2 className="text-2xl font-bold">Billing and Invoices</h2>
        <input
          type="text"
          value={searchTerm}
          placeholder="Search by invoice no, customer name, plan, invoice date or login mobile"
          className="w-[60vh] rounded-md border border-[orange] p-1"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto show-scrollbar rounded-lg border border-gray-300 bg-white shadow-md">
      <table className="w-full min-w-[1100px] overflow-hidden">
        <thead>
          <tr className="bg-[#F97316] text-sm text-white">
            <th className="px-2 py-2">Invoice Id</th>
            <th className="px-2 py-2">Invoice Date</th>
            <th className="px-2 py-2">Plan</th>
            <th className="px-2 py-2">Customer Name</th>
            <th className="px-2 py-2 whitespace-nowrap">Login Mobile</th>
            <th className="px-2 py-2">Status</th>
            <th className="px-2 py-2">Download</th>
            <th className="px-2 py-2">More</th>
          </tr>
        </thead>
        <tbody>
          {Results.map((invoice) => (
            <tr key={invoice.invoiceId ?? invoice.id} className="border-t text-sm">
              <td className="px-4 py-3 text-center">{invoice.invoiceId?.replace(/\s+/g, "")}</td>
              <td className="px-4 py-3">{formattedDate(invoice.invoiceDate)}</td>
              <td className="px-4 py-3">
                {invoice?.itemName
                  ? invoice.itemName
                  : invoice.payment?.courses?.length === 1
                    ? invoice.payment.courses[0].courseName
                    : "Multiple courses"}
              </td>
              <td className="px-4 py-3">
                {clientCompanyByUserId[String(invoice?.users?.id)] || invoice?.users?.userName || '—'}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                {invoice?.users?.mobileNo || '—'}
              </td>
              <td className="px-4 py-3 text-center">{invoice.payment?.status}</td>
              <td className="px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAutoDownload(true)
                    setInvoiceData(invoice)
                  }}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50"
                  title="Download"
                >
                  <i className="ri-download-2-line text-lg" />
                </button>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAutoDownload(false)
                    setInvoiceData(invoice)
                  }}
                  className="rounded-lg bg-green-500 px-3 py-1 text-white hover:bg-green-700"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={handlePrevious} className="rounded-md border border-grey-500 p-2">
          Prev
        </button>
        <span className="rounded-md bg-black p-2 font-black text-white">{currentPage}</span>
        <button type="button" onClick={handleNext} className="rounded-md border border-grey-500 p-2">
          Next
        </button>
      </div>
      {invoiceData && (
        <Invoice
          invoice={invoiceData}
          autoDownload={autoDownload}
          onClose={() => {
            setInvoiceData(null)
            setAutoDownload(false)
          }}
          orgData={orgData}
        />
      )}
    </div>
  )
}

export default BillingInvoices
