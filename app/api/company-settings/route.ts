export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to get the default organization
async function getDefaultOrganization() {
  const org = await prisma.organization.findFirst()
  if (!org) {
    // Create a default one if none exists
    return await prisma.organization.create({
      data: {
        name: 'Meine Firma',
        slug: 'default-org',
        address: '',
        zipCode: '',
        city: '',
        country: 'DE'
      }
    })
  }
  return org
}

export async function GET() {
  try {
    const org = await getDefaultOrganization()

    // Map DB fields to frontend fields
    const mappedSettings = {
      companyName: org.name,
      taxNumber: org.taxId || '',
      address: org.address,
      postalCode: org.zipCode,
      city: org.city,
      country: org.country,
      bankName: org.bankName || '',
      iban: org.iban || '',
      bic: org.bic || '',
      logoPath: org.logoUrl || '',
      // Add other fields if needed, e.g. phone/email if added to schema or stored in JSON
    }

    return NextResponse.json(mappedSettings)
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const org = await getDefaultOrganization()

    const updatedOrg = await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: body.companyName,
        taxId: body.taxNumber,
        address: body.address,
        zipCode: body.postalCode,
        city: body.city,
        country: body.country,
        bankName: body.bankName,
        iban: body.iban,
        bic: body.bic,
        logoUrl: body.logoPath
      }
    })

    console.log('Company settings updated in DB:', updatedOrg)

    return NextResponse.json({
      message: 'Company settings updated successfully',
      settings: {
        companyName: updatedOrg.name,
        taxNumber: updatedOrg.taxId,
        address: updatedOrg.address,
        postalCode: updatedOrg.zipCode,
        city: updatedOrg.city,
        country: updatedOrg.country,
        bankName: updatedOrg.bankName,
        iban: updatedOrg.iban,
        bic: updatedOrg.bic,
        logoPath: updatedOrg.logoUrl
      }
    })
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    )
  }
}
