export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only images are allowed.` },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = path.extname(file.name)
    const filename = `logo-${timestamp}${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const logoUrl = `logos/${filename}`

    // Update Organization in Database
    // We assume there's at least one organization or we find the first one
    const org = await prisma.organization.findFirst()
    if (org) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { logoUrl: logoUrl }
      })
    } else {
      // Create default if not exists (though unlikely if app is running)
      await prisma.organization.create({
        data: {
          name: 'Meine Firma',
          slug: 'default-org',
          logoUrl: logoUrl,
          address: '',
          zipCode: '',
          city: '',
          country: 'DE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      filename: logoUrl,
      message: 'Logo uploaded and saved successfully'
    })

  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload logo' },
      { status: 500 }
    )
  }
}
