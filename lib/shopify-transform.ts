/**
 * Shopify Data Transformation Utility
 * 
 * Centralizes the logic for converting scraped product data and user settings
 * into the final format expected by the Shopify API.
 */

export interface ShopifyTransformSettings {
    collection?: string
    priceMultiplier?: string | number
    isActive: boolean
    isPhysical: boolean
    chargeTax: boolean
    trackQuantity: boolean
    collections?: any[]
}

export function transformToShopifyProduct(product: any, settings: ShopifyTransformSettings) {
    const multiplier = parseFloat(String(settings.priceMultiplier)) || 1

    // 1. Calculate Prices
    const calculatePrice = (basePrice: string | number | undefined) => {
        if (basePrice === undefined) return "0.00"
        const price = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice
        return isNaN(price) ? "0.00" : (price * multiplier).toFixed(2)
    }

    const finalPrice = calculatePrice(product.price || 0)
    const finalCompareAtPrice = product.compare_at_price
        ? calculatePrice(product.compare_at_price)
        : (parseFloat(finalPrice) * 1.3).toFixed(2)

    // 2. Format Metafields
    const formatMetafield = (key: string, value: any, type: string, namespace = 'custom') => {
        if (!value) return null
        let finalValue = value

        if (type === 'rich_text_field') {
            const strValue = typeof value === 'string' ? value : String(value)
            const preservedText = strValue
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<[^>]*>/g, '')
                .trim()

            finalValue = JSON.stringify({
                type: "root",
                children: [{
                    type: "paragraph",
                    children: [{ type: "text", value: preservedText }]
                }]
            })
        } else if (type === 'multi_line_text_field') {
            const strValue = typeof value === 'string' ? value : String(value)
            finalValue = strValue
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<[^>]*>/g, '')
                .trim()
        } else {
            finalValue = String(value).substring(0, 255)
        }

        return { namespace, key, value: finalValue, type }
    }

    const superMetafields = [
        formatMetafield('mpn', product.google_mpn || product.sku, 'single_line_text_field', 'custom'),
        formatMetafield('condition', product.google_condition || 'new', 'single_line_text_field', 'custom'),
        formatMetafield('gender', product.google_gender || 'unisex', 'single_line_text_field', 'custom'),
        formatMetafield('age_group', product.google_age_group || 'adult', 'single_line_text_field', 'custom'),
        formatMetafield('size_type', product.google_size_type, 'single_line_text_field', 'custom'),
        formatMetafield('size_system', product.google_size_system, 'single_line_text_field', 'custom'),
        formatMetafield('google_product_category', product.google_custom_product, 'single_line_text_field', 'custom'),
        formatMetafield('customs_description', product.dhl_customs_item_description || product.dhl_custom_description || product.title?.slice(0, 50), 'single_line_text_field', 'custom'),
        formatMetafield('shipping_cost', product.shipping_costs || product.versandkosten || '0.00', 'single_line_text_field', 'custom'),
        formatMetafield('shipping_time', product.shipping_date_time, 'single_line_text_field', 'custom'),
        formatMetafield('details_content', product.collapsible_row_1_content, 'rich_text_field', 'custom'),
        formatMetafield('details_heading', product.collapsible_row_1_heading || 'Details', 'single_line_text_field', 'custom'),
        formatMetafield('shipping_content', product.collapsible_row_2_content, 'rich_text_field', 'custom'),
        formatMetafield('shipping_heading', product.collapsible_row_2_heading || 'Lieferung', 'single_line_text_field', 'custom'),
        formatMetafield('warranty_content', product.collapsible_row_3_content, 'rich_text_field', 'custom'),
        formatMetafield('warranty_heading', product.collapsible_row_3_heading || 'Garantie', 'single_line_text_field', 'custom'),
        formatMetafield('benefits', product.emoji_benefits, 'multi_line_text_field', 'custom'),
        formatMetafield('title_tag', product.metaTitle || product.title, 'single_line_text_field', 'global'),
        formatMetafield('description_tag', product.metaDescription || (product.description?.replace(/<[^>]*>/g, '').slice(0, 160)), 'multi_line_text_field', 'global'),
        formatMetafield('source_url', product.sourceUrl, 'single_line_text_field', 'custom'),
        formatMetafield('source_domain', product.sourceDomain, 'single_line_text_field', 'custom')
    ].filter(m => m !== null)

    // 3. Prepare Variants
    const shopifyVariants = (product.variants && product.variants.length > 0)
        ? product.variants.map((v: any, idx: number) => {
            const variantEntry: any = {
                title: v.title || `Variant ${idx + 1}`,
                price: calculatePrice(v.price || product.price),
                compare_at_price: v.compare_at_price ? calculatePrice(v.compare_at_price) : (parseFloat(calculatePrice(v.price || product.price)) * 1.3).toFixed(2),
                sku: v.sku || (product.sku ? `${product.sku}-${idx}` : undefined),
                barcode: v.barcode || product.ean,
                inventory_management: settings.trackQuantity ? 'shopify' : null,
                inventory_quantity: settings.trackQuantity ? 888 : null,
                taxable: settings.chargeTax,
                requires_shipping: settings.isPhysical,
                metafields: superMetafields
            }

            if (v.options && Array.isArray(v.options)) {
                v.options.forEach((opt: string, i: number) => {
                    if (i < 3) variantEntry[`option${i + 1}`] = opt
                })
            } else {
                variantEntry.option1 = v.title || `Variant ${idx + 1}`
            }

            return variantEntry
        })
        : [{
            title: 'Default Title',
            option1: 'Default Title',
            price: finalPrice,
            compare_at_price: finalCompareAtPrice,
            sku: product.sku,
            barcode: product.ean,
            taxable: settings.chargeTax,
            inventory_management: settings.trackQuantity ? 'shopify' : null,
            inventory_quantity: settings.trackQuantity ? 888 : null,
            requires_shipping: settings.isPhysical,
            metafields: superMetafields
        }]

    // 4. Final Shopify Product Object
    const selectedCollectionTitle = settings.collections?.find((c: any) => String(c.id) === settings.collection)?.title || "Keine Kollektion"

    return {
        title: product.title,
        body_html: product.fullDescription || product.description,
        vendor: product.vendor || 'Unknown',
        product_type: product.product_type || 'General',
        handle: product.handle,
        status: settings.isActive ? 'active' : 'draft',
        tags: product.tags ? `${product.tags}, Imported, Source:${product.sourceDomain}` : `Imported, Source:${product.sourceDomain}`,
        images: (product.images || [])
            .map((img: any) => {
                const src = typeof img === 'string' ? img : (img?.src || '');
                const alt = typeof img === 'string' ? product.title : (img?.alt || product.title);
                return { src, alt };
            })
            .filter((img: any) => {
                if (!img.src || typeof img.src !== 'string') return false;

                // Must be absolute HTTP(S) URL
                if (!img.src.startsWith('http')) return false;

                // Filter out common invalid/junk patterns
                if (img.src.includes('base64') || img.src.includes('data:')) return false;

                // Shopify REST API does not support SVG images for products
                const lowerSrc = img.src.toLowerCase();
                if (lowerSrc.endsWith('.svg') || lowerSrc.includes('.svg?')) return false;

                // Basic check for common tracking/social junk if generic scrape
                if (lowerSrc.includes('analytics') || lowerSrc.includes('pixel') || lowerSrc.includes('facebook') || lowerSrc.includes('tracking')) {
                    // Only skip if it's clearly an icon/not a product image
                    if (lowerSrc.includes('icon') || lowerSrc.includes('logo')) return false;
                }

                return true;
            })
            .slice(0, 20) // Limit to top 20 images to reduce noise and avoid API bloat
            .map((img: any) => {
                // Robust URL normalization
                try {
                    let sanitizedUrl = img.src.trim();
                    // Ensure the URL is properly encoded for Shopify
                    // We decode first to avoid double-encoding
                    const finalUrl = encodeURI(decodeURI(sanitizedUrl));
                    return {
                        src: finalUrl,
                        alt: String(img.alt || product.title || 'Product Image').slice(0, 512)
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean),
        variants: shopifyVariants,
        metafields: superMetafields,
        options: product.options?.map((o: any) => ({ name: o.name })) || (product.variants?.length > 0 ? [{ name: 'Title' }] : undefined),
        // Extra info for preview only (not for Shopify API)
        _preview: {
            collectionTitle: selectedCollectionTitle,
            priceCalculation: `${product.price} × ${multiplier} = ${finalPrice}`,
            metaTitle: product.metaTitle || product.title,
            metaDescription: product.metaDescription || (product.description?.replace(/<[^>]*>/g, '').slice(0, 160))
        }
    }
}
