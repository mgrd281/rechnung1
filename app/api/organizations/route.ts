export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

// Global storage for organizations (in production, this would be a database)
declare global {
  var organizations: any[] | undefined
}

// Initialize global storage with mock data
if (!global.organizations) {
  global.organizations = [
    {
      id: '1',
      name: 'Muster GmbH',
      address: 'Geschäftsstraße 123',
      zipCode: '12345',
      city: 'Berlin',
      country: 'Deutschland',
      taxId: 'DE123456789',
      bankName: 'Deutsche Bank',
      iban: 'DE89 3704 0044 0532 0130 00',
      bic: 'COBADEFFXXX',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Tech Solutions AG',
      address: 'Innovationsweg 456',
      zipCode: '80331',
      city: 'München',
      country: 'Deutschland',
      taxId: 'DE987654321',
      bankName: 'Commerzbank',
      iban: 'DE12 5008 0000 0123 4567 89',
      bic: 'DRESDEFF800',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
}

export async function GET() {
  try {
    console.log('Fetching all organizations:', global.organizations?.length || 0)
    return NextResponse.json(global.organizations || [])
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating new organization:', body)

    if (!global.organizations) {
      global.organizations = []
    }

    // Validate required fields
    const requiredFields = ['name', 'address', 'zipCode', 'city', 'taxId', 'bankName', 'iban', 'bic']
    for (const field of requiredFields) {
      if (!body[field] || body[field].trim() === '') {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            message: `Field '${field}' is required`,
            field: field
          },
          { status: 400 }
        )
      }
    }

    // Generate new ID
    const newId = (Math.max(...global.organizations.map(org => parseInt(org.id)), 0) + 1).toString()

    const newOrganization = {
      id: newId,
      name: body.name,
      address: body.address,
      zipCode: body.zipCode,
      city: body.city,
      country: body.country || 'Deutschland',
      taxId: body.taxId,
      bankName: body.bankName,
      iban: body.iban,
      bic: body.bic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    global.organizations.push(newOrganization)

    console.log('Created organization:', newOrganization)

    return NextResponse.json({
      success: true,
      message: 'Organisation erfolgreich erstellt',
      organization: newOrganization
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create organization',
        message: 'Ein Fehler ist beim Erstellen der Organisation aufgetreten'
      },
      { status: 500 }
    )
  }
}

