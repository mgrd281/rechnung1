/**
 * Renders recipient block for invoices
 * Handles both company and individual customers
 */

interface Customer {
  name?: string
  companyName?: string
  company?: string
  contactPerson?: string
  address?: string
  street?: string
  zipCode?: string
  city?: string
  country?: string
  email?: string
  isCompany?: boolean
}

export function renderRecipientBlock(customer: Customer): string[] {
  const lines: string[] = []
  
  // Extract fields
  const name = (customer.name || '').toString().trim()
  const companyName = (customer.companyName || customer.company || '').toString().trim()
  const contactPerson = (customer.contactPerson || '').toString().trim()
  const street = (customer.address || customer.street || '').toString().trim()
  const zip = (customer.zipCode || '').toString().trim()
  const city = (customer.city || '').toString().trim()
  const country = (customer.country || '').toString().trim()
  const email = (customer.email || '').toString().trim()

  console.log('🔍 renderRecipientBlock input:', {
    name, companyName, street, zip, city, country,
    isCompany: customer.isCompany,
    originalCustomer: customer
  })

  console.log('📊 Field analysis:', {
    hasName: name !== '',
    hasCompanyName: companyName !== '',
    hasContactPerson: contactPerson !== '',
    hasStreet: street !== '',
    hasZipCity: (zip !== '' || city !== ''),
    hasCountry: country !== ''
  })

  // For companies
  if (customer.isCompany) {
    // Company Name first (primary)
    if (companyName) {
      lines.push(companyName)
    }
    
    // Contact Person second (secondary)
    if (contactPerson) {
      lines.push(contactPerson)
    }
    
    // Fallback only if both company name and contact person are empty
    if (!companyName && !contactPerson) {
      lines.push('Unbekannter Kunde')
    }
  } else {
    // For individuals
    if (name) {
      lines.push(name)
    } else {
      lines.push('Unbekannter Kunde')
    }
  }

  // Add address information if available
  if (street) {
    lines.push(street)
  }

  // Add ZIP + City on same line if available
  if (zip || city) {
    const zipCityLine = `${zip} ${city}`.trim()
    if (zipCityLine) {
      lines.push(zipCityLine)
    }
  }

  // Add country if available
  if (country) {
    lines.push(country)
  }

  const finalLines = lines.filter(line => line.trim() !== '')
  console.log('✅ renderRecipientBlock output:', finalLines)
  
  return finalLines
}
