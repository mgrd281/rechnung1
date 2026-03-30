import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as cheerio from 'cheerio'
import { ShopifyAPI } from '@/lib/shopify-api'

export const dynamic = 'force-dynamic'

// Helper for title extraction
async function extractProductTitle(html: string, source: string): Promise<string> {
    const $ = cheerio.load(html)
    let title = ''

    if (source === 'amazon') {
        title = $('h1#title').text().trim() ||
            $('span#productTitle').text().trim() ||
            $('a[data-hook="product-link"]').text().trim()
    } else if (source === 'aliexpress') {
        title = $('meta[property="og:title"]').attr('content') ||
            $('h1[data-pl="product-title"]').text().trim() ||
            $('title').text().trim()
    } else if (source === 'vercel') {
        title = $('h1').first().text().trim() || $('title').text().trim()
    }

    // Clean title (remove common suffixes)
    return title.split('|')[0].split('-')[0].trim()
}

// Simple string similarity (Levenshtein would be better but this is a start)
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[()]/g, '')
    const s2 = str2.toLowerCase().replace(/[()]/g, '')

    if (s1.includes(s2) || s2.includes(s1)) return 0.9

    // Check for matching numbers (IDs, SKUs) - Strong signal
    const nums1 = s1.match(/\d{4,}/g) || []
    const nums2 = (s2.match(/\d{4,}/g) || []) as string[]
    const commonNums = nums1.filter(n => nums2.includes(n))
    if (commonNums.length > 0) return 0.95

    // Split into words and check overlap
    const words1 = s1.split(/\s+/).filter(w => w.length > 2)
    const words2 = s2.split(/\s+/).filter(w => w.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const intersection = words1.filter(w => words2.includes(w))
    const score = intersection.length / Math.max(words1.length, words2.length)

    return score
}

async function findMatchedProduct(extractedTitle: string, shopifyProducts: any[]) {
    if (!extractedTitle) return null

    let bestMatch = null
    let highestScore = 0

    for (const product of shopifyProducts) {
        const score = calculateSimilarity(extractedTitle, product.title)
        if (score > highestScore) {
            highestScore = score
            bestMatch = product
        }
    }

    return highestScore > 0.4 ? bestMatch : null
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { urls, autoMapping } = body

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ error: 'URLs are required as an array' }, { status: 400 })
        }

        const results: any[] = []
        const api = new ShopifyAPI()
        const allShopifyProducts = await api.getProducts({ limit: 250 })
        const organizationId = (await prisma.organization.findFirst())?.id || ''

        for (const url of urls) {
            try {
                // Same scraper logic as single import...
                let source = 'unknown'
                if (url.includes('aliexpress.com')) source = 'aliexpress'
                if (url.includes('amazon.')) source = 'amazon'
                if (url.includes('vercel.app')) source = 'vercel'

                if (source === 'unknown') {
                    results.push({ url, error: 'Unsupported source' })
                    continue
                }

                // URL optimization for Amazon
                let targetUrl = url
                if (source === 'amazon') {
                    const asinMatch = url.match(/(?:dp|gp\/product|product-reviews)\/([A-Z0-9]{10})/)
                    if (asinMatch && asinMatch[1]) {
                        const asin = asinMatch[1]
                        const domain = url.split('/')[2]
                        targetUrl = `https://${domain}/product-reviews/${asin}/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews`
                    }
                }

                const response = await fetch(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    }
                })

                if (!response.ok) {
                    results.push({ url, error: `Fetch failed: ${response.status}` })
                    continue
                }

                const html = await response.text()

                // Extract reviews (reusing logic from single import would be better but for brevity we'll inline/adapt)
                // In a real app we'd move the scraper logic to a shared utility
                const reviewsFound: any[] = []
                const $ = cheerio.load(html)

                // Title extraction for mapping
                const extractedTitle = await extractProductTitle(html, source)
                const matchedProduct = autoMapping ? await findMatchedProduct(extractedTitle, allShopifyProducts) : null

                if (autoMapping && !matchedProduct) {
                    results.push({ url, error: `Could not match product: ${extractedTitle}` })
                    continue
                }

                // Scraper part... (simplified for now to basic Amazon/Vercel)
                if (source === 'amazon') {
                    $('div[data-hook="review"]').each((i, el) => {
                        // Limit removed
                        const ratingText = $(el).find('i[data-hook="review-star-rating"] span').text() || $(el).find('i[data-hook="cmps-review-star-rating"] span').text()
                        const rating = parseInt(ratingText.split(' ')[0]) || 5
                        const title = $(el).find('a[data-hook="review-title"]').text().trim() || $(el).find('span[data-hook="review-title"]').text().trim()
                        const content = $(el).find('span[data-hook="review-body"]').text().trim()
                        const author = $(el).find('span.a-profile-name').text().trim() || 'Amazon Customer'

                        if (title || content) {
                            reviewsFound.push({ rating, title, content: content || title, customerName: author, date: new Date().toISOString(), source: 'amazon' })
                        }
                    })
                } else if (source === 'vercel') {
                    // Fix: Vercel reviews are in a JS file
                    // 1. Find the script tag
                    const scriptSrc = $('script[src^="reviews_data_"]').attr('src')
                    if (scriptSrc) {
                        try {
                            console.log(`Vercel: Found script ${scriptSrc}, fetching...`)
                            const jsUrl = new URL(scriptSrc, targetUrl).href
                            const jsRes = await fetch(jsUrl)
                            if (jsRes.ok) {
                                const jsContent = await jsRes.text()
                                console.log(`Vercel: Fetched JS content (${jsContent.length} bytes)`)
                                // Extract JSON: const REVIEWS_DATA = [...]
                                const jsonMatch = jsContent.match(/const REVIEWS_DATA\s*=\s*(\[[\s\S]*?\]);/)
                                if (jsonMatch && jsonMatch[1]) {
                                    console.log('Vercel: JSON match found, parsing...')
                                    const reviewsData = JSON.parse(jsonMatch[1]) // This might fail if simpler JS obj, but for now assume JSON-like
                                    console.log(`Vercel: Parsed ${reviewsData.length} reviews`)

                                    reviewsData.forEach((r: any) => {
                                        // Limit removed
                                        // Clean date
                                        let date = new Date().toISOString()
                                        if (r.date) date = new Date(r.date).toISOString()

                                        reviewsFound.push({
                                            rating: r.rating || 5,
                                            title: r.title || '',
                                            content: r.content || '',
                                            customerName: r.customer_name || 'Vercel Customer',
                                            date: date,
                                            source: 'vercel'
                                        })
                                    })
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing Vercel JS:', e)
                        }
                    }

                    // Fallback to table if JS fails (or for older pages)
                    if (reviewsFound.length === 0) {
                        $('table tbody tr').each((i, el) => {
                            // ... existing table logic (kept as fallback)
                            const cells = $(el).find('td')
                            if (cells.length >= 5) {
                                const ratingStars = $(cells[1]).find('span').length || 5
                                const title = $(cells[2]).text().trim()
                                const content = $(cells[3]).text().trim()
                                const name = $(cells[4]).text().trim()
                                if (content || title) {
                                    reviewsFound.push({ rating: ratingStars, title, content: content || title, customerName: name, date: new Date().toISOString(), source: 'vercel' })
                                }
                            }
                        })
                    }
                }

                if (reviewsFound.length === 0) {
                    results.push({ url, error: 'No reviews found' })
                    continue
                }

                // Save to DB
                let savedCount = 0
                const targetProductIds = matchedProduct ? [matchedProduct.id] : [] // In bulk we usually assume 1:1 for URL:Product

                if (targetProductIds.length > 0) {
                    const productId = targetProductIds[0]

                    // NEW: Save source for auto-sync
                    try {
                        await prisma.reviewSource.upsert({
                            where: {
                                organizationId_url: {
                                    organizationId,
                                    url
                                }
                            },
                            create: {
                                organizationId,
                                productId: String(productId),
                                productTitle: matchedProduct.title,
                                url,
                                type: source,
                                isActive: true,
                                lastSyncAt: new Date()
                            },
                            update: {
                                productId: String(productId),
                                productTitle: matchedProduct.title,
                                isActive: true,
                                lastSyncAt: new Date()
                            }
                        })
                    } catch (sourceErr) {
                        console.error('Failed to save review source:', sourceErr)
                    }
                    const existingReviews = await prisma.review.findMany({
                        where: {
                            organizationId,
                            productId: String(productId),
                            source: source
                        },
                        select: {
                            content: true,
                            customerName: true
                        }
                    })

                    // Create a set for faster lookup
                    const existingSet = new Set(existingReviews.map(r => `${r.customerName}|${(r.content || '').substring(0, 50)}`))

                    const newReviews = reviewsFound.filter(review => {
                        const key = `${review.customerName}|${review.content.substring(0, 50)}`
                        if (existingSet.has(key)) return false
                        existingSet.add(key) // Avoid duplicates within the import itself
                        return true
                    })


                    if (newReviews.length > 0) {
                        try {
                            await prisma.review.createMany({
                                data: newReviews.map(review => ({
                                    organizationId,
                                    productId: String(productId),
                                    productTitle: matchedProduct.title,
                                    customerName: review.customerName,
                                    customerEmail: `import@${source}.com`,
                                    rating: review.rating,
                                    title: review.title,
                                    content: review.content,
                                    source: review.source,
                                    status: 'APPROVED',
                                    createdAt: review.date,
                                    isVerified: true
                                }))
                            })
                            savedCount = newReviews.length
                        } catch (dbError) {
                            console.error('Database Batch Insert Error:', dbError)
                            results.push({ url, error: 'Database error during batch insert' })
                            continue
                        }
                    }
                    console.log(`Saved ${savedCount} new reviews`)
                    results.push({ url, success: true, count: savedCount, product: matchedProduct.title })
                } else {
                    results.push({ url, error: 'No target product selected' })
                }

            } catch (urlError) {
                console.error(`Error processing ${url}:`, urlError)
                results.push({ url, error: 'Internal processing error' })
            }
        }

        return NextResponse.json({ success: true, results })

    } catch (error) {
        console.error('Bulk Import API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
