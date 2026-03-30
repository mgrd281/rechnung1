export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import {
  getAllTemplates,
  getTemplateById,
  saveTemplate,
  deleteTemplate,
  setDefaultTemplate,
  generateTemplateId,
  InvoiceTemplate
} from '@/lib/invoice-templates'
import { requireAuth } from '@/lib/auth-middleware'

// GET - Get all templates or specific template
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    const type = searchParams.get('type')

    if (templateId) {
      // Get specific template
      const template = await getTemplateById(templateId)
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: template })
    }

    // Get all templates or filter by type
    let templates = await getAllTemplates()

    if (type) {
      templates = templates.filter(t => t.type === type)
    }

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length
    })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    const templateData = await request.json()

    // Validate required fields
    if (!templateData.name || !templateData.type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Create new template with generated ID
    const newTemplate: InvoiceTemplate = {
      id: generateTemplateId(),
      name: templateData.name,
      type: templateData.type,
      isDefault: templateData.isDefault || false,
      texts: templateData.texts || {},
      bankDetails: templateData.bankDetails,
      settings: {
        showBankDetails: true,
        showPaymentInstructions: true,
        showDueDate: true,
        showTaxInfo: true,
        highlightTotal: true,
        ...templateData.settings
      },
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        ...templateData.styling
      },
      defaults: {
        status: 'Offen',
        dueDays: 14,
        taxRate: 19,
        showBankDetails: true,
        showPaymentInstructions: true,
        ...templateData.defaults
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save template
    await saveTemplate(newTemplate)

    console.log(`✅ Created new template: ${newTemplate.name} (${newTemplate.id})`)

    return NextResponse.json({
      success: true,
      data: newTemplate,
      message: 'Template created successfully'
    })

  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

// PUT - Update existing template
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    const templateData = await request.json()

    if (!templateData.id) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template exists
    const existingTemplate = await getTemplateById(templateData.id)
    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // Update template
    const updatedTemplate: InvoiceTemplate = {
      ...existingTemplate,
      ...templateData,
      updatedAt: new Date().toISOString()
    }

    await saveTemplate(updatedTemplate)

    console.log(`✅ Updated template: ${updatedTemplate.name} (${updatedTemplate.id})`)

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update template: ' + error },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = requireAuth(request)
    if ('error' in auth) {
      return auth.error
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    try {
      const deleted = await deleteTemplate(templateId)

      if (!deleted) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        )
      }

      console.log(`✅ Deleted template: ${templateId}`)

      return NextResponse.json({
        success: true,
        message: 'Template deleted successfully'
      })

    } catch (error: any) {
      if (error.message === 'Default template cannot be deleted') {
        return NextResponse.json(
          { success: false, error: 'Default template cannot be deleted' },
          { status: 400 }
        )
      }
      throw error
    }

  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
