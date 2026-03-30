/**
 * Client-side PDF utility functions.
 * These are safe to use in 'use client' components as they don't depend on Node.js APIs like Buffer.
 */

export async function downloadInvoicePDF(invoiceId: string, invoiceNumber: string = '') {
    try {
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
        if (!response.ok) {
            throw new Error('Download failed')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = invoiceNumber ? `Rechnung_${invoiceNumber}.pdf` : `Rechnung_${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        return true
    } catch (error) {
        console.error('Error downloading PDF:', error)
        throw error
    }
}
