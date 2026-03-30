import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import OpenAI from 'openai'
import { ImageAnnotatorClient } from '@google-cloud/vision'
import path from 'path'

// ... (keep existing DOMMatrix polyfill if needed, or remove if we are sure)
// Polyfill DOMMatrix for pdf-parse in Node environment
if (typeof DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
        a: number; b: number; c: number; d: number; e: number; f: number;
        constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
        }
        translate() { return this; }
        scale() { return this; }
        toString() { return 'matrix(1, 0, 0, 1, 0, 0)'; }
    }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Explicitly set Node.js runtime

export async function POST(request: NextRequest) {
    try {
        // Initialize OpenAI inside try-catch to prevent crashes if env var is missing
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        // Initialize Google Cloud Vision inside try-catch to prevent crashes
        let visionClient;
        try {
            let visionConfig = {};
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
                const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
                visionConfig = { credentials };
            } else {
                visionConfig = {
                    keyFilename: path.join(process.cwd(), 'google-cloud-credentials.json')
                };
            }
            visionClient = new ImageAnnotatorClient(visionConfig);
        } catch (initError) {
            console.error('Failed to initialize Google Cloud Vision:', initError);
        }

        const authResult = requireAuth(request)
        if ('error' in authResult) {
            return authResult.error
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Safety check for file size (e.g. 10MB limit) to prevent OOM
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({
                success: true,
                data: {
                    ai_status: 'ERROR',
                    error_reason: 'FILE_TOO_LARGE',
                    debug_text: 'File is too large (>10MB). Please upload a smaller file.'
                }
            })
        }

        let text = ''
        const buffer = Buffer.from(await file.arrayBuffer())

        if (file.type === 'application/pdf') {
            try {
                // @ts-ignore
                const pdf = require('pdf-parse');

                // Set a timeout for PDF parsing
                const parsePromise = pdf(buffer);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('PDF parse timeout')), 5000));

                const data: any = await Promise.race([parsePromise, timeoutPromise]);
                text = data.text

                if (!text || text.trim().length < 5) {
                    throw new Error('PDF has no extractable text (likely a scan)');
                }
            } catch (e: any) {
                console.error('PDF parse error:', e)
                // Fallback to image-style OCR if we can't extract text from PDF
                // For now, return error as GPT-4o Vision doesn't handle PDF bytes directly without conversion
                return NextResponse.json({
                    success: true,
                    data: {
                        ai_status: 'ERROR',
                        error_reason: 'SCANNED_PDF',
                        debug_text: `PDF seems to be a scan. Please enter data manually or upload an image. (Error: ${e.message})`
                    }
                })
            }
        } else if (file.type.startsWith('image/')) {
            // Use Google Cloud Vision for OCR
            try {
                if (visionClient) {
                    const [result] = await visionClient.textDetection(buffer);
                    const detections = result.textAnnotations;
                    if (detections && detections.length > 0) {
                        text = detections[0].description || '';
                        console.log('Google Vision OCR success, text length:', text.length);
                    } else {
                        console.log('Google Vision found no text.');
                    }
                } else {
                    console.log('Google Vision client not initialized.');
                }
            } catch (visionError) {
                console.error('Google Vision API Error:', visionError);
            }
        }

        let result

        // If we have text (from PDF or Google Vision), use GPT-4o for parsing
        if (text && text.trim().length > 0) {
            console.log('Extracted text (first 500 chars):', text.substring(0, 500))

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert German accounting assistant. Analyze the text and extract structured data."
                    },
                    {
                        role: "user",
                        content: `Extract fields into JSON:\n- totalAmount: number (gross EUR, handle '1.000,00' as 1000.00). Look for 'Gesamt', 'Summe', 'Zahlbetrag', 'Rechnungsbetrag'. IGNORE 'Zwischensumme'.\n- date: string (YYYY-MM-DD). If multiple dates, prefer 'Rechnungsdatum'.\n- description: string (German summary)\n- category: 'INCOME' | 'EXPENSE'\n- invoiceNumber: string (optional)\n- supplier: string\n- confidence: 'high' | 'medium' | 'low'\n- ai_status: 'OK' | 'WARNING' | 'ERROR'\n\nText:\n${text.substring(0, 15000)}`
                    }
                ],
                response_format: { type: "json_object" }
            })
            result = JSON.parse(response.choices[0].message.content || '{}')
            result.debug_text = text.substring(0, 200);
        } else if (file.type.startsWith('image/')) {
            // Fallback: If Google Vision failed or returned no text, try GPT-4o Vision directly
            console.log('Falling back to GPT-4o Vision');
            const base64Image = buffer.toString('base64')
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this document (invoice/receipt) for German accounting. Extract data into JSON.\n\nRules:\n1. **totalAmount**: Look for 'Gesamtbetrag', 'Summe', 'Total', 'Zu zahlen', 'Endbetrag'. Prefer the largest final amount. Ignore 'Zwischensumme' or 'Netto'. Convert '1.234,56' to 1234.56. If multiple amounts exist, pick the final payable one.\n2. **date**: YYYY-MM-DD. Look for 'Datum', 'Rechnungsdatum', 'Leistungsdatum'.\n3. **description**: Short German summary (e.g. 'Büromaterial', 'Software Lizenz').\n4. **category**: 'INCOME' (if issued BY user) or 'EXPENSE' (if issued TO user/receipt).\n5. **supplier**: Name of the vendor/shop (e.g. 'Amazon', 'Shell', 'Telekom').\n6. **confidence**: 'high', 'medium', or 'low' based on how clear the total amount is.\n7. **ai_status**: 'OK' if amount/date found, 'WARNING' if unsure, 'ERROR' if nothing found.\n\nReturn ONLY raw JSON." },
                            {
                                type: "image_url",
                                image_url: {
                                    "url": `data:${file.type};base64,${base64Image}`
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 800,
            })
            const content = response.choices[0].message.content
            result = parseJsonFromLlm(content)
            result.debug_text = 'GPT-4o Vision processed';
        } else {
            // PDF with no text and no image fallback
            return NextResponse.json({
                success: true,
                data: {
                    ai_status: 'ERROR',
                    error_reason: 'SCANNED_PDF_COMPLEX',
                    debug_text: 'PDF has no text and could not be processed.'
                }
            })
        }

        console.log('OCR Result:', JSON.stringify(result, null, 2))
        return NextResponse.json({ success: true, data: result })

    } catch (error: any) {
        console.error('OCR Error:', error)
        return NextResponse.json({
            success: true,
            data: {
                ai_status: 'ERROR',
                error_reason: 'OCR_FAILED',
                debug_text: `OCR System Error: ${error.message || error}`
            }
        })
    }
}

function parseJsonFromLlm(content: string | null) {
    if (!content) return {}
    try {
        // Remove markdown code blocks if present
        const clean = content.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(clean)
    } catch (e) {
        console.error('JSON parse error', e)
        return {}
    }
}
