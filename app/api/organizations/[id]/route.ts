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

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  const { id } = await params
  try {
    console.log('Fetching organization with ID:', id)

    const organization = global.organizations?.find(org => org.id === id)

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    console.log('Found organization:', organization)
    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: any }
) {
  const { id } = await params
  try {
    const body = await request.json()

    if (!global.organizations) {
      global.organizations = []
    }

    const organizationIndex = global.organizations.findIndex(org => org.id === id)

    if (organizationIndex === -1) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
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

    // Validate IBAN format (basic validation)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/
    if (!ibanRegex.test(body.iban.replace(/\s/g, ''))) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid IBAN format',
          field: 'iban'
        },
        { status: 400 }
      )
    }

    // Validate Tax ID format (basic validation for German tax ID)
    if (body.taxId && !body.taxId.match(/^DE[0-9]{9}$/)) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid Tax ID format. Should be DE followed by 9 digits',
          field: 'taxId'
        },
        { status: 400 }
      )
    }

    // Update the organization
    const previousOrganization = { ...global.organizations[organizationIndex] }
    global.organizations[organizationIndex] = {
      ...global.organizations[organizationIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }

    const updatedOrganization = global.organizations[organizationIndex]

    console.log('Organization update:')
    console.log('Previous:', previousOrganization)
    console.log('Updated:', updatedOrganization)
    console.log('Changes applied:', Object.keys(body))

    return NextResponse.json({
      success: true,
      message: 'Organisation erfolgreich aktualisiert',
      organization: updatedOrganization
    })

  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      {
        error: 'Failed to update organization',
        message: 'Ein Fehler ist beim Aktualisieren der Organisation aufgetreten'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  const { id } = await params
  try {
    console.log('Deleting organization with ID:', id)

    if (!global.organizations) {
      global.organizations = []
    }

    const organizationIndex = global.organizations.findIndex(org => org.id === id)

    if (organizationIndex === -1) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Remove the organization
    const deletedOrganization = global.organizations.splice(organizationIndex, 1)[0]

    console.log('Deleted organization:', deletedOrganization)

    return NextResponse.json({
      success: true,
      message: 'Organisation erfolgreich gelöscht',
      organization: deletedOrganization
    })

  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete organization',
        message: 'Ein Fehler ist beim Löschen der Organisation aufgetreten'
      },
      { status: 500 }
    )
  }
}
