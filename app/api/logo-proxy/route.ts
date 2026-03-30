import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
    }

    // Fetch the image from the external URL
    const response = await fetch(imageUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer()

    // Convert to base64
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/png'

    // Return base64 data
    return NextResponse.json({
      success: true,
      base64: `data:${contentType};base64,${base64}`,
      contentType
    })

  } catch (error) {
    console.error('Error fetching logo:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
