export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json()

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        // 1. Try Shopify JSON endpoint first (most reliable for Shopify stores)
        try {
            const shopifyUrl = url.endsWith('.json') ? url : `${url}.json`
            const response = await fetch(shopifyUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })

            if (response.ok) {
                const contentType = response.headers.get('content-type')
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json()
                    if (data.product) {
                        return NextResponse.json({
                            product: {
                                title: data.product.title,
                                description: data.product.body_html?.replace(/<[^>]*>/g, '').slice(0, 200) + '...', // Plain text preview
                                fullDescription: data.product.body_html,
                                price: data.product.variants?.[0]?.price || '0.00',
                                currency: 'EUR', // Default assumption or extract if possible
                                images: data.product.images?.map((img: any) => img.src) || [],
                                vendor: data.product.vendor,
                                product_type: data.product.product_type,
                                tags: data.product.tags,
                                variants: data.product.variants,
                                options: data.product.options
                            }
                        })
                    }
                }
            }
        } catch (e) {
            console.log('Shopify JSON fetch failed, trying generic scrape...', e)
        }

        // 2. Multi-Provider Proxy Strategy (Enterprise Grade)
        // We implement a waterfall fallback: Bright Data -> ZenRows -> ScrapingBee -> ScrapingAnt -> ScraperAPI -> Direct
        // This ensures maximum reliability. If one service is down or blocked, the other takes over.

        const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY
        const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY
        const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY
        const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY
        const SCRAPINGANT_API_KEY = process.env.SCRAPINGANT_API_KEY

        // Helper to parse HTML and extract data (Shared logic)
        const parseProductData = ($: any, vendor: string, sourceUrl: string) => {
            let data: any = {
                title: '',
                description: '',
                fullDescription: '',
                price: '0.00',
                currency: 'EUR',
                images: [],
                vendor: vendor || '',
                product_type: '',
                tags: 'Imported',
                variants: [],
                options: [],
                metaTitle: '',
                metaDescription: '',
                canonicalUrl: sourceUrl,
                sku: '',
                ean: '',
                compare_at_price: null,
                discount_percentage: 0,
                videos: [],
                // New Fields
                google_mpn: '',
                google_age_group: 'adult',
                google_condition: 'new',
                google_gender: 'unisex',
                google_custom_label_0: '',
                google_custom_label_1: '',
                google_custom_label_2: '',
                google_custom_label_3: '',
                google_custom_label_4: '',
                google_custom_product: '',
                google_size_type: '',
                google_size_system: '',
                dhl_customs_item_description: '',
                shipping_costs: '',
                shipping_date_time: '',
                collapsible_row_1_heading: 'Details',
                collapsible_row_1_content: '',
                collapsible_row_2_heading: 'Shipping Info',
                collapsible_row_2_content: '',
                collapsible_row_3_heading: 'Returns',
                collapsible_row_3_content: '',
                emoji_benefits: '',
                beae_countdown_start: '',
                beae_countdown_end: '',
                ecomposer_countdown_end: '',
                offer_end_date: '',
                product_boosts: '',
                related_products_settings: '',
                related_products: ''
            }

            // A. Try JSON-LD (Schema.org) - The Gold Standard
            $('script[type="application/ld+json"]').each((_: number, el: any) => {
                try {
                    const jsonContent = $(el).html()
                    if (!jsonContent) return

                    const json = JSON.parse(jsonContent)
                    const items = Array.isArray(json) ? json : [json]

                    const findProduct = (obj: any): any => {
                        const types = ['Product', 'http://schema.org/Product', 'ProductGroup', 'http://schema.org/ProductGroup'];
                        if (types.includes(obj['@type'])) return obj;
                        if (obj['@graph']) return obj['@graph'].find((item: any) => types.includes(item['@type']));
                        return null;
                    }

                    const product = items.map(findProduct).find(Boolean);

                    if (product) {
                        data.title = product.name || data.title
                        data.description = product.description || data.description
                        data.vendor = product.brand?.name || product.brand || data.vendor
                        data.product_type = product.category || data.product_type
                        data.sku = product.sku || data.sku
                        data.ean = product.gtin || product.gtin13 || product.gtin12 || product.ean || data.ean
                        data.google_mpn = product.mpn || data.sku

                        if (product.image) {
                            const imgs = Array.isArray(product.image) ? product.image : [product.image];
                            imgs.forEach((img: any) => {
                                const src = typeof img === 'string' ? img : (img.url || img['@id']);
                                if (src) data.images.push({ src, alt: product.name || '' });
                            });
                        }

                        if (product.offers) {
                            const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
                            if (offers.length > 1) {
                                data.variants = offers.map((offer: any) => ({
                                    title: offer.name || offer.sku || 'Variant',
                                    price: offer.price,
                                    sku: offer.sku,
                                    available: offer.availability?.includes('InStock') ?? true
                                }));
                            }
                            const firstOffer = offers[0];
                            data.price = firstOffer.price || data.price;
                            data.currency = firstOffer.priceCurrency || data.currency;
                        }
                    }
                } catch (e) { }
            })

            // A2. Try NEXT_DATA or Productinfos (Modern Web Apps like AboutYou)
            const nextDataHtml = $('script#__NEXT_DATA__').html() || $('script[data-testid="Productinfos"]').html()
            if (nextDataHtml) {
                try {
                    const json = JSON.parse(nextDataHtml)
                    const props = json.props?.pageProps || (Array.isArray(json) ? json[0] : json)

                    // AboutYou specific path
                    const ayProd = props.product || props.initialState?.product || (props['@type'] === 'ProductGroup' ? props : null)
                    if (ayProd) {
                        data.title = ayProd.name || ayProd.title || data.title
                        data.vendor = ayProd.brand?.name || ayProd.brand || data.vendor
                        data.description = ayProd.description?.text || ayProd.description || data.description

                        if (ayProd.price?.min) {
                            data.price = (ayProd.price.min / 100).toFixed(2)
                        } else if (ayProd.price?.withTax) {
                            data.price = (ayProd.price.withTax / 100).toFixed(2)
                        } else if (ayProd.offers?.lowPrice) {
                            data.price = ayProd.offers.lowPrice
                        }

                        // Extract images from AboutYou structure
                        const rawImages = ayProd.images || ayProd.image || []
                        if (Array.isArray(rawImages)) {
                            rawImages.forEach((img: any) => {
                                let src = ''
                                if (typeof img === 'string') src = img
                                else src = img.hash ? `https://cdn.aboutstatic.com/m/${img.hash}` : (img.url || img.src)

                                if (src) data.images.push({ src, alt: data.title })
                            })
                        }
                    }
                } catch (e) { }
            }

            // B. Meta Tags (SEO & OpenGraph)
            data.metaTitle = $('title').text() || $('meta[property="og:title"]').attr('content')
            data.metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content')
            data.canonicalUrl = $('link[rel="canonical"]').attr('href') || sourceUrl

            // Meta Image Fallback
            const metaImg = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content')
            if (metaImg && !data.images.some((i: any) => i.src === metaImg)) {
                data.images.push({ src: metaImg, alt: data.title })
            }

            // C. Super Metadata Extraction (Tables & Details)
            const extractedMetadata: any = {}
            $('table tr, .specification-row, .p_details__row, .product-info-row').each((_: number, el: any) => {
                const key = $(el).find('th, td:first-child, .label, dt').text().trim().replace(':', '')
                const value = $(el).find('td:last-child, .value, dd').text().trim()
                if (key && value && key.length < 50 && value.length < 500) {
                    extractedMetadata[key] = value
                }
            })

            // Mapping for Google/DHL/Custom Fields
            data.google_mpn = extractedMetadata['MPN'] || extractedMetadata['Herstellernummer'] || extractedMetadata['Modellbezeichnung'] || data.google_mpn
            data.google_condition = extractedMetadata['Zustand'] || extractedMetadata['Condition'] || (sourceUrl.includes('ebay') ? 'used' : 'new')
            data.google_gender = extractedMetadata['Geschlecht'] || extractedMetadata['Gender'] || 'unisex'
            data.google_age_group = extractedMetadata['Altersgruppe'] || extractedMetadata['Age Group'] || 'adult'
            data.google_size_type = extractedMetadata['Größentyp'] || extractedMetadata['Size Type'] || ''
            data.google_size_system = extractedMetadata['Größensystem'] || extractedMetadata['Size System'] || ''

            data.dhl_customs_item_description = extractedMetadata['Zolltarifnummer'] || extractedMetadata['Customs Description'] || data.title.slice(0, 50)
            data.shipping_costs = extractedMetadata['Versandkosten'] || extractedMetadata['Shipping'] || ''
            data.shipping_date_time = extractedMetadata['Versanddatum'] || extractedMetadata['Delivery Time'] || ''

            // Category / Breadcrumbs Extraction
            const breadcrumbs: string[] = []
            $('.nav_grimm-breadcrumb__link, .breadcrumb-item, .breadcrumbs li, .breadcrumb a').each((_: number, el: any) => {
                const text = $(el).text().trim()
                if (text && text !== 'Startseite' && text !== 'Home') breadcrumbs.push(text)
            })
            if (breadcrumbs.length > 0) {
                data.product_type = breadcrumbs[breadcrumbs.length - 1]
                data.tags = (data.tags ? data.tags + ', ' : '') + breadcrumbs.join(', ')
            }

            // Collapsible rows & Ganze Details
            data.collapsible_row_1_heading = "Produktdetails"
            data.collapsible_row_1_content = Object.entries(extractedMetadata)
                .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
                .join('<br>')

            data.collapsible_row_2_heading = "Versand & Lieferung"
            data.collapsible_row_2_content = extractedMetadata['Lieferumfang'] || "Standardversand weltweit."

            data.collapsible_row_3_heading = "Rückgabe & Garantie"
            data.collapsible_row_3_content = extractedMetadata['Garantie'] || "30 Tage Rückgaberecht."

            // D. Specific Vendor Logic (Amazon, Otto, etc.) with Alt-Text
            if (vendor === 'Amazon') {
                data.title = data.title || $('#productTitle').text().trim()
                data.description = data.description || $('#feature-bullets').text().trim() || $('#productDescription').text().trim()

                // Technical Specs from Amazon Table (Expanded)
                $('#prodDetails tr, #technicalSpecifications_feature_div tr, .a-keyvalue tr, #detailBullets_feature_div li').each((_: number, el: any) => {
                    const key = $(el).find('th, td:first-child, .a-list-item b').text().trim().replace(/[:\n]/g, '')
                    const value = $(el).find('td:last-child, .a-list-item span:last-child').text().trim()
                    if (key && value && key.length < 50) extractedMetadata[key] = value
                })

                // Amazon High-Res Image Extraction (Deep Scan)
                const amazonImgRegex = /"hiRes":"([^"]+)"|"large":"([^"]+)"/g
                const htmlString = $.html()
                let imgMatch;
                while ((imgMatch = amazonImgRegex.exec(htmlString)) !== null) {
                    const src = imgMatch[1] || imgMatch[2]
                    if (src && !data.images.some((i: any) => i.src === src)) {
                        data.images.push({ src, alt: data.title })
                    }
                }

                $('#imgTagWrapperId img, #landingImage, #altImages img, .a-dynamic-image').each((_: number, el: any) => {
                    const src = $(el).attr('src') || $(el).attr('data-old-hires') || $(el).attr('data-a-dynamic-image')
                    const alt = $(el).attr('alt') || data.title
                    if (src && !src.includes('base64')) {
                        if (src.startsWith('{')) {
                            try {
                                const urls = Object.keys(JSON.parse(src))
                                const highRes = urls[urls.length - 1]
                                if (!data.images.some((i: any) => i.src === highRes)) {
                                    data.images.push({ src: highRes, alt })
                                }
                            } catch (e) { }
                        } else {
                            if (!data.images.some((i: any) => i.src === src)) {
                                data.images.push({ src, alt })
                            }
                        }
                    }
                })
            }
            else if (vendor === 'Otto') {
                data.title = data.title || $('h1[data-qa="product-title"]').text().trim() || $('.pdp_productName').text().trim()

                // Enhanced Description Extraction for Otto (Deep Scan)
                const descSelectors = [
                    '.pdp_product-description__text',
                    '#productDescription',
                    '.pdp_details-accordion__content',
                    '.product-description',
                    '[data-qa="product-description"]'
                ];

                for (const selector of descSelectors) {
                    const text = $(selector).text().trim();
                    if (text && text.length > (data.description?.length || 0)) {
                        data.description = text;
                    }
                }

                // Fallback: Find the longest paragraph in the main area
                if (!data.description || data.description.length < 50) {
                    $('p, .text-block').each((_: number, el: any) => {
                        const t = $(el).text().trim();
                        if (t.length > (data.description?.length || 0) && t.length > 100) {
                            data.description = t;
                        }
                    });
                }

                // Technical Specs
                $('.pdp_details-accordion__content tr, table tr').each((_: number, el: any) => {
                    const key = $(el).find('td:first-child, th').text().trim()
                    const value = $(el).find('td:last-child').text().trim()
                    if (key && value) extractedMetadata[key] = value
                })

                // Principal Image
                const mainImg = $('img[id^="pdp_mainProductImage"]').first().attr('src') || $('img[id^="mainProductImage"]').first().attr('src')
                if (mainImg) data.images.push({ src: mainImg, alt: data.title })

                // Gallery Images
                $('img.carousel__image, .pdp_product-gallery__image img, .carousel li img, .pdp_productGallery__image img').each((_: number, el: any) => {
                    const src = $(el).attr('data-src') || $(el).attr('src')
                    const alt = $(el).attr('alt') || data.title
                    if (src && !data.images.some((i: any) => i.src === src)) {
                        data.images.push({ src, alt })
                    }
                })

                // Variants (Otto specific color selection)
                $('.pdp_dimension-selection__color-tile-label').each((_: number, el: any) => {
                    const colorName = $(el).text().trim()
                    const thumb = $(el).find('img').attr('src')
                    if (colorName) {
                        data.variants.push({
                            title: colorName,
                            price: data.price,
                            image: thumb,
                            available: true
                        })
                    }
                })
            }
            else if (sourceUrl.includes('christ.de')) {
                data.vendor = 'Christ'
                data.title = $('h1.product-name').text().trim() || $('.product-detail-name').text().trim() || data.title

                // Advanced Price Extraction
                const priceMeta = $('meta[itemprop="price"]').attr('content') ||
                    $('meta[property="product:price:amount"]').attr('content') ||
                    $('.product-price .sales .value').attr('content');

                if (priceMeta) {
                    data.price = priceMeta;
                } else {
                    const priceText = $('.product-price').first().text().replace(/[^0-9,.]/g, '') ||
                        $('.price-sales').text().replace(/[^0-9,.]/g, '');
                    if (priceText) data.price = priceText.replace(',', '.');
                }

                // Description from Tabs & Collapsibles
                data.description = $('.product-description-text').text().trim() ||
                    $('#tab-description').text().trim() ||
                    $('.description-text').text().trim() ||
                    $('.collapsible-content').text().trim();

                // Technical Specs from Tables (Robust Selector)
                $('.product-attributes tr, .attributes-table tr, .data-table tr, .specification-table tr, .product-details tr').each((_: number, el: any) => {
                    const key = $(el).find('th, td.label, td:first-child').text().trim().replace(':', '')
                    const value = $(el).find('td, td.value, td:last-child').text().trim()

                    if (key && value && value.length > 1) { // Filter empty values
                        extractedMetadata[key] = value

                        // Map specific fields for Christ
                        if (key.toLowerCase().includes('material')) data.tags += `, ${value}`
                        if (key.toLowerCase().includes('geschlecht') || key.toLowerCase().includes('gender')) data.google_gender = value.toLowerCase().includes('damen') ? 'female' : 'male'
                    }
                })

                // Images
                $('.product-gallery img, .s7-static-image, .slick-slide img').each((_: number, el: any) => {
                    let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy');
                    if (src) {
                        if (src.includes('?')) src = src.split('?')[0] // Remove dimensions
                        if (!src.startsWith('http')) src = 'https://www.christ.de' + src; // Ensure absolute URL
                        if (!data.images.some((i: any) => i.src === src)) {
                            data.images.push({ src, alt: data.title })
                        }
                    }
                })
            }
            else if (sourceUrl.includes('zalando')) {
                data.vendor = $('.K9_Bex.re_oN.Z9_Y6.u5_M_').text() || data.vendor
                data.title = $('h1 span').text() || data.title
                $('.Q81_0w.re_oN.Z9_Y6.u5_M_').each((_: number, el: any) => {
                    const text = $(el).text()
                    if (text.includes('€')) data.price = text.replace(/[^0-9,.]/g, '').replace(',', '.')
                })
                $('img.RY9u9S.pY9u9S').each((_: number, el: any) => {
                    const src = $(el).attr('src')
                    if (src) data.images.push({ src, alt: data.title })
                })
            }
            else if (sourceUrl.includes('aboutyou.de')) {
                data.vendor = $('[data-testid="brandNameContainer"]').text().trim() || 'AboutYou'
                data.title = $('h1[data-testid="productName"]').text().trim() ||
                    $('h1[data-test-id="ProductName"]').text().trim() ||
                    $('[data-test-id="productName"]').text().trim() ||
                    data.title

                // Price extraction
                const salesPrice = $('[data-testid="finalPrice"]').text() ||
                    $('[data-test-id="ProductPriceSales"]').text() ||
                    $('[data-test-id="formattedPriceSales"]').text()
                if (salesPrice) {
                    data.price = salesPrice.replace(/[^0-9,.]/g, '').replace(',', '.')
                }

                // Images
                $('[data-testid="productImageView"] img, [data-testid="productImageSlider"] img, [data-test-id="ProductImageSlider"] img, [data-test-id="ProductImage"] img, img[data-test-id="GalleryImage"]').each((_: number, el: any) => {
                    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('srcset')?.split(' ')[0]
                    if (src && !data.images.some((i: any) => i.src === src)) {
                        data.images.push({ src, alt: data.title })
                    }
                })
            }
            else if (sourceUrl.includes('ebay')) {
                data.title = data.title || $('.x-item-title__mainTitle').text().trim()
                data.price = $('.x-price-primary').text().replace(/[^0-9,.]/g, '').replace(',', '.') || data.price
                data.google_condition = $('.x-item-condition-text').text().toLowerCase().includes('neu') ? 'new' : 'used'
                $('.ux-image-filmstrip-carousel img').each((_: number, el: any) => {
                    const src = $(el).attr('src')?.replace(/s-l\d+/, 's-l1600')
                    if (src) data.images.push({ src, alt: data.title })
                })
            }
            else {
                // Generic image extraction with Alt-Text
                $('img').each((_: number, el: any) => {
                    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src')
                    const alt = $(el).attr('alt') || $(el).attr('title') || data.title

                    if (src && !src.includes('analytics') && !src.includes('tracking') && !src.includes('base64')) {
                        // Avoid small icons and common logos
                        if (!src.includes('logo') && !src.includes('icon') && !src.includes('placeholder')) {
                            if (!data.images.some((i: any) => i.src === src)) {
                                data.images.push({ src, alt: alt || data.title })
                            }
                        }
                    }
                })

                // Video extraction
                $('video source').each((_: number, el: any) => {
                    const src = $(el).attr('src')
                    if (src) data.videos.push(src)
                })
                $('iframe').each((_: number, el: any) => {
                    const src = $(el).attr('src')
                    if (src && (src.includes('youtube') || src.includes('vimeo'))) {
                        data.videos.push(src)
                    }
                })
            }

            // E. Regex Deep Scan for Images (Last Resort)
            if (data.images.length === 0) {
                const imgRegex = /"(https:\/\/i\.otto\.de\/i\/otto\/[^"]+)"/g
                let match;
                const htmlString = $.html()
                while ((match = imgRegex.exec(htmlString)) !== null) {
                    const src = match[1]
                    if (!data.images.some((i: any) => i.src === src)) {
                        data.images.push({ src, alt: data.title })
                    }
                }
            }

            // D. Variant Detection (Advanced)
            // Look for config objects in script tags (Shopify, WooCommerce)
            $('script').each((_: number, el: any) => {
                const content = $(el).html() || ''
                if (content.includes('product') && content.includes('variants')) {
                    try {
                        // Very basic extraction - in reality we might need a more robust regex or parser
                        const variantMatch = content.match(/variants":\s*(\[.*?\])/)
                        if (variantMatch) {
                            const variants = JSON.parse(variantMatch[1]);
                            data.variants = variants;
                        }
                    } catch (e) { }
                }
            })

            // E. Normalization & Fallbacks
            // CRITICAL FIX: Ensure image normalization handles both string and {src, alt} objects correctly
            data.images = data.images.map((img: any) => {
                let imgSrc = '';
                let imgAlt = data.title || '';

                if (typeof img === 'string') {
                    imgSrc = img;
                } else if (img && typeof img === 'object') {
                    imgSrc = img.src || '';
                    imgAlt = img.alt || data.title || '';
                }

                if (!imgSrc) return null;

                // Absolute URL resolution
                if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
                if (!imgSrc.startsWith('http')) {
                    try { imgSrc = new URL(imgSrc, sourceUrl).toString() } catch { return null }
                }

                return { src: imgSrc, alt: imgAlt };
            }).filter(Boolean);

            // Remove duplicated images based on SRC
            const uniqueImages: any[] = [];
            const seenSrcs = new Set();
            data.images.forEach((img: any) => {
                if (!seenSrcs.has(img.src)) {
                    seenSrcs.add(img.src);
                    uniqueImages.push(img);
                }
            });
            data.images = uniqueImages;

            // If no variants, create a default one
            if (data.variants.length === 0) {
                data.variants = [{
                    title: 'Default Title',
                    price: data.price,
                    sku: data.sku,
                    available: true
                }];
            }

            data.fullDescription = data.description;

            // Final fallback for title if everything else failed
            if (!data.title && data.metaTitle) {
                data.title = data.metaTitle.split('|')[0].split('-')[0].trim() || data.metaTitle;
            }

            return data;
        }

        // Helper for timeout
        const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000) => {
            const controller = new AbortController()
            const id = setTimeout(() => controller.abort(), timeout)
            try {
                const response = await fetch(url, { ...options, signal: controller.signal })
                clearTimeout(id)
                return response
            } catch (error) {
                clearTimeout(id)
                throw error
            }
        }

        // DETECTION & FETCHING
        if (url.includes('amazon') || url.includes('otto.de') || url.includes('aboutyou.de')) {
            const vendor = url.includes('otto.de') ? 'Otto' : (url.includes('aboutyou.de') ? 'AboutYou' : 'Amazon')
            let html = ''

            // Strategy 1: ZenRows (Premium)
            if (ZENROWS_API_KEY && !html) {
                try {
                    const zenRowsUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(url)}&js_render=true&antibot=true&premium_proxy=true`
                    const response = await fetchWithTimeout(zenRowsUrl, {}, 25000)
                    if (response.ok) html = await response.text()
                } catch (e) { console.error('ZenRows failed:', e) }
            }

            // Strategy 2: ScrapingAnt (Backup)
            if (SCRAPINGANT_API_KEY && !html) {
                try {
                    // Basic scrapingant request
                    const saUrl = `https://api.scrapingant.com/v2/general?x-api-key=${SCRAPINGANT_API_KEY}&url=${encodeURIComponent(url)}`
                    const response = await fetchWithTimeout(saUrl, {}, 25000)
                    if (response.ok) html = await response.text()
                } catch (e) { console.error('ScrapingAnt failed:', e) }
            }

            // Strategy 3: ScraperAPI (Backup)
            if (SCRAPERAPI_KEY && !html) {
                try {
                    const sUrl = `http://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}`
                    const response = await fetchWithTimeout(sUrl, {}, 25000)
                    if (response.ok) html = await response.text()
                } catch (e) { console.error('ScraperAPI failed:', e) }
            }

            // Strategy 4: Direct Fetch with Enhanced Headers (Last Resort)
            if (!html) {
                const enhancedHeaders = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Referer': 'https://www.google.com/',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'cross-site',
                    'Sec-Fetch-User': '?1'
                }
                try {
                    const response = await fetchWithTimeout(url, { headers: enhancedHeaders }, 10000)
                    if (response.ok) html = await response.text()
                } catch (e) { console.error('Direct fetch failed:', e) }
            }

            if (html) {
                // Check for Captcha
                if (html.includes('api-services-support@amazon.com') || html.includes('alt="Dogs of Amazon"')) {
                    console.warn('Amazon CAPTCHA detected')
                    // Continue to try parsing, but it implies failure usually
                }

                const productData = parseProductData(cheerio.load(html), vendor, url)
                if (productData.title) return NextResponse.json({ product: productData })
            }
        }

        // FINAL FALLBACK: DIRECT SCRAPE
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
        }

        const response = await fetch(url, { headers })
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)

        const html = await response.text()
        const $ = cheerio.load(html)
        const productData = parseProductData($, '', url)

        if (!productData.title) {
            return NextResponse.json({ error: 'Could not detect product data.' }, { status: 400 })
        }

        return NextResponse.json({ product: productData })

    } catch (error) {
        console.error('Error importing product:', error)
        return NextResponse.json({ error: 'Failed to fetch product data.' }, { status: 500 })
    }
}
