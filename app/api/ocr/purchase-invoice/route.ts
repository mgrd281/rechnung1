import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Initialize Google Cloud Vision
        let visionClient: any;
        try {
            let visionConfig = {};
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
                const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
                visionConfig = { credentials };
            } else {
                const credentialsPath = path.join(process.cwd(), 'google-cloud-credentials.json');
                visionConfig = { keyFilename: credentialsPath };
            }
            visionClient = new ImageAnnotatorClient(visionConfig);
        } catch (e) {
            console.error('[OCR] Vision Client Init Error:', e);
        }

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ ok: false, error: 'Ungültiger Dateityp (PDF, JPG, PNG erlaubt)', code: 'UNSUPPORTED_TYPE' }, { status: 400 });
        }

        // Validate file size (20MB)
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ ok: false, error: 'Datei zu groß (max. 20MB)', code: 'FILE_TOO_LARGE' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const documentId = uuidv4();

        let extractedText = '';

        // OCR Pipeline
        if (file.type === 'application/pdf') {
            try {
                // @ts-ignore
                const pdf = require('pdf-parse');
                const data = await pdf(buffer);
                extractedText = data.text;

                if (!extractedText || extractedText.trim().length < 10) {
                    console.log('[OCR] PDF seems to be a scan, falling back to Vision API or GPT-4o Vision if it were images');
                    // Note: For real scanned PDFs, we would need to convert pages to images.
                    // For now, if no text is found, we might fail or suggest manual entry.
                    // But let's try to extract at least something or flag it.
                }
            } catch (e) {
                console.error('[OCR] PDF Parse Error:', e);
            }
        } else {
            // Image OCR via Google Vision
            if (visionClient) {
                try {
                    const [result] = await visionClient.textDetection(buffer);
                    const detections = result.textAnnotations;
                    if (detections && detections.length > 0) {
                        extractedText = detections[0].description || '';
                    }
                } catch (e) {
                    console.error('[OCR] Vision API Error:', e);
                }
            }
        }

        // Extraction via GPT-4o
        let extractionResult: any = {};

        if (extractedText || file.type.startsWith('image/')) {
            const messages: any[] = [
                {
                    role: 'system',
                    content: `You are an expert German accounting AI. Extract structured data from the provided text or image.
                    Return ONLY a JSON object with these fields:
                    - supplierName: string
                    - invoiceNumber: string
                    - invoiceDate: string (YYYY-MM-DD or null)
                    - dueDate: string (YYYY-MM-DD or null)
                    - net: number (float)
                    - vat: number (float)
                    - gross: number (float)
                    - currency: string (e.g. "EUR")
                    - lineItems: Array<{ description: string, qty: number, unitPrice: number, total: number }>
                    - confidence: number (0.0 to 1.0)`
                }
            ];

            if (extractedText) {
                messages.push({
                    role: 'user',
                    content: `Extract data from this text:\n\n${extractedText.substring(0, 10000)}`
                });
            } else {
                // Image fallback to GPT-4o Vision
                const base64Image = buffer.toString('base64');
                messages.push({
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Extract data from this invoice image.' },
                        { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64Image}` } }
                    ]
                });
            }

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                response_format: { type: 'json_object' }
            });

            extractionResult = JSON.parse(response.choices[0].message.content || '{}');
        }

        // Ensure confidence is present
        if (!extractionResult.confidence) {
            extractionResult.confidence = extractedText ? 0.85 : 0.7;
        }

        return NextResponse.json({
            ok: true,
            data: {
                documentId,
                extracted: extractionResult
            }
        });

    } catch (error: any) {
        console.error('[OCR API] Error:', error);
        return NextResponse.json({
            ok: false,
            error: error.message || 'Interner Serverfehler',
            code: 'OCR_PROVIDER_ERROR'
        }, { status: 500 });
    }
}
