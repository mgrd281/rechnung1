// Mock data utilities for testing

// Export function to get mock data (for testing)
export function getMockData() {
  return { 
    invoices: global.csvInvoices || [], 
    customers: global.csvCustomers || [] 
  }
}

// Initialize global storage
declare global {
  var csvInvoices: any[] | undefined
  var csvCustomers: any[] | undefined
}

if (typeof global !== 'undefined') {
  if (!global.csvInvoices) {
    global.csvInvoices = []
  }
  if (!global.csvCustomers) {
    global.csvCustomers = []
  }
}
