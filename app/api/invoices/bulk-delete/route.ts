export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          error: 'Ungültige Anfrage',
          message: 'Es wurden keine Rechnungs-IDs angegeben.'
        },
        { status: 400 }
      )
    }

    console.log('Bulk deleting invoices with IDs:', ids)

    // Delete invoices from the database
    // We don't check for status anymore as per user request
    const deleteResult = await prisma.invoice.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    console.log(`Successfully deleted ${deleteResult.count} invoices`)

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} Rechnung${deleteResult.count !== 1 ? 'en' : ''} erfolgreich gelöscht`,
      deleted: deleteResult.count,
      errors: [],
      mockInvoicesSkipped: 0
    })

  } catch (error) {
    console.error('Error in bulk delete:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Löschen',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      },
      { status: 500 }
    )
  }
}
