export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import {
  DocumentTemplate,
  DocumentType,
  getAllDocumentTemplates,
  getTemplatesByType,
  getTemplateById,
  RECEIPT_TEMPLATES
} from '@/lib/document-templates'

// Global storage for document templates (in production, use database)
declare global {
  var documentTemplates: DocumentTemplate[] | undefined
}

// Initialize global storage
if (!global.documentTemplates) {
  global.documentTemplates = [...RECEIPT_TEMPLATES]
}

// GET /api/document-templates - Get all templates or filter by type
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as DocumentType | null
    const category = searchParams.get('category')

    let templates = global.documentTemplates || []

    // Filter by type if specified
    if (type) {
      templates = templates.filter(template => template.type === type)
    }

    // Filter by category if specified
    if (category) {
      templates = templates.filter(template => template.category === category)
    }

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length
    })
  } catch (error) {
    console.error('Error fetching document templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document templates' },
      { status: 500 }
    )
  }
}

// POST /api/document-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const templateData = await request.json()

    // Validate required fields
    if (!templateData.name || !templateData.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const newId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newTemplate: DocumentTemplate = {
      id: newId,
      name: templateData.name,
      type: templateData.type,
      category: templateData.category || 'financial',
      isDefault: templateData.isDefault || false,
      content: {
        title: templateData.content?.title || 'Dokumenttitel',
        subtitle: templateData.content?.subtitle || '',
        headerNote: templateData.content?.headerNote || '',
        bodyText: templateData.content?.bodyText || '',
        footerNote: templateData.content?.footerNote || '',
        thankYouNote: templateData.content?.thankYouNote || '',
        legalNote: templateData.content?.legalNote || '',
        instructionsText: templateData.content?.instructionsText || ''
      },
      settings: {
        showBankDetails: templateData.settings?.showBankDetails ?? true,
        showPaymentInstructions: templateData.settings?.showPaymentInstructions ?? true,
        showItemsTable: templateData.settings?.showItemsTable ?? true,
        showTotals: templateData.settings?.showTotals ?? true,
        showDueDate: templateData.settings?.showDueDate ?? true,
        showTaxInfo: templateData.settings?.showTaxInfo ?? true,
        requireSignature: templateData.settings?.requireSignature ?? false,
        allowPartialPayment: templateData.settings?.allowPartialPayment ?? false
      },
      styling: {
        primaryColor: templateData.styling?.primaryColor || '#2563eb',
        secondaryColor: templateData.styling?.secondaryColor || '#64748b',
        textColor: templateData.styling?.textColor || '#1f2937',
        backgroundColor: templateData.styling?.backgroundColor || '#ffffff'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // If this is set as default, remove default from other templates of same type
    if (newTemplate.isDefault) {
      global.documentTemplates = global.documentTemplates?.map(template =>
        template.type === newTemplate.type
          ? { ...template, isDefault: false }
          : template
      ) || []
    }

    // Add to global storage
    global.documentTemplates = [...(global.documentTemplates || []), newTemplate]

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template created successfully'
    })
  } catch (error) {
    console.error('Error creating document template:', error)
    return NextResponse.json(
      { error: 'Failed to create document template' },
      { status: 500 }
    )
  }
}

// PUT /api/document-templates - Update existing template
export async function PUT(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const templateData = await request.json()

    if (!templateData.id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const existingTemplateIndex = global.documentTemplates?.findIndex(
      template => template.id === templateData.id
    ) ?? -1

    if (existingTemplateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const updatedTemplate: DocumentTemplate = {
      ...templateData,
      updatedAt: new Date().toISOString()
    }

    // If this is set as default, remove default from other templates of same type
    if (updatedTemplate.isDefault) {
      global.documentTemplates = global.documentTemplates?.map(template =>
        template.type === updatedTemplate.type && template.id !== updatedTemplate.id
          ? { ...template, isDefault: false }
          : template
      ) || []
    }

    // Update in global storage
    global.documentTemplates![existingTemplateIndex] = updatedTemplate

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Error updating document template:', error)
    return NextResponse.json(
      { error: 'Failed to update document template' },
      { status: 500 }
    )
  }
}

// DELETE /api/document-templates - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const templateIndex = global.documentTemplates?.findIndex(
      template => template.id === templateId
    ) ?? -1

    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const template = global.documentTemplates![templateIndex]

    // Prevent deletion of default templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default template' },
        { status: 400 }
      )
    }

    // Remove from global storage
    global.documentTemplates = global.documentTemplates?.filter(
      template => template.id !== templateId
    ) || []

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting document template:', error)
    return NextResponse.json(
      { error: 'Failed to delete document template' },
      { status: 500 }
    )
  }
}
