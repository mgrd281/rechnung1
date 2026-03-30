import * as cheerio from 'cheerio';

interface ScrapedPrice {
    price: number;
    currency: string;
    available: boolean;
}

export class PriceScraper {
    private static async fetchHTML(url: string): Promise<string | null> {
        try {
            // Use a realistic User-Agent to avoid immediate blocking
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            });

            if (!response.ok) {
                console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                return null;
            }

            return await response.text();
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return null;
        }
    }

    private static parsePrice(priceText: string): number {
        // Remove currency symbols, non-breaking spaces, and normalize decimal separator
        // "12,90 €" -> "12.90"
        const cleanText = priceText
            .replace(/[^\d,.]/g, '') // Keep only digits, commas, dots
            .replace(/\./g, '')      // Remove thousands separator dots (European format)
            .replace(',', '.');      // Replace decimal comma with dot

        return parseFloat(cleanText) || 0;
    }

    static async scrapeIdealo(url: string): Promise<{ price: number, shopName?: string, shopUrl?: string }> {
        const html = await this.fetchHTML(url);
        if (!html) return { price: 0 };

        const $ = cheerio.load(html);

        // Idealo typically puts the best price in a prominent element
        // We want to find the FIRST offer in the list, which is the cheapest

        // 1. Find the first product offer item
        const firstOffer = $('.productOffers-listItem').first();

        // 2. Extract Price
        let priceText = firstOffer.find('.productOffers-listItemTitlePrice').text().trim();

        // Fallback strategies for price
        if (!priceText) priceText = $('.oopStage-priceRangePrice').first().text();
        if (!priceText) priceText = $('.price').first().text();

        const price = this.parsePrice(priceText);

        // 3. Extract Shop Name
        // Usually in an image alt tag or a specific shop name class
        let shopName = firstOffer.find('.productOffers-listItemOfferShopV2LogoImage').attr('alt');
        if (!shopName) shopName = firstOffer.find('.productOffers-listItemOfferShopV2Name').text().trim();

        // Fallback: Try to find shop name in the "Sold by" section if available
        if (!shopName) {
            shopName = 'Idealo (Unbekannt)';
        }

        // Clean up shop name (remove "Logo von " etc.)
        shopName = shopName?.replace('Logo von ', '').replace('Logo ', '').trim();

        // 4. Extract Shop URL (The "Zum Kauf" button)
        // This is usually a redirect link from Idealo
        let shopUrl = firstOffer.find('a.productOffers-listItemTitle').attr('href');
        if (!shopUrl) shopUrl = firstOffer.find('.productOffers-listItemOfferShopV2Button').attr('href');

        // If relative URL, prepend idealo.de
        if (shopUrl && !shopUrl.startsWith('http')) {
            shopUrl = `https://www.idealo.de${shopUrl}`;
        }

        return { price, shopName, shopUrl };
    }

    static async scrapeBilliger(url: string): Promise<number> {
        const html = await this.fetchHTML(url);
        if (!html) return 0;

        const $ = cheerio.load(html);

        // Billiger.de selectors
        // Main price in product header
        let priceText = $('.product-price-offer').first().text();

        if (!priceText) {
            priceText = $('span[data-test="product-price"]').first().text();
        }

        return this.parsePrice(priceText);
    }

    static async scrapeSoftwareDeals24(url: string): Promise<number> {
        const html = await this.fetchHTML(url);
        if (!html) return 0;
        const $ = cheerio.load(html);
        // Common shopify or woocommerce selectors, or specific to their theme
        // Looking for schema.org microdata or common price classes
        let priceText = $('.price').first().text();
        if (!priceText) priceText = $('.product-price').first().text();
        return this.parsePrice(priceText);
    }

    static async scrapeBestSoftware(url: string): Promise<number> {
        const html = await this.fetchHTML(url);
        if (!html) return 0;
        const $ = cheerio.load(html);
        let priceText = $('.price').first().text();
        if (!priceText) priceText = $('.product-info-price .price').first().text();
        return this.parsePrice(priceText);
    }

    static async scrapeGeneric(url: string): Promise<number> {
        const html = await this.fetchHTML(url);
        if (!html) return 0;
        const $ = cheerio.load(html);

        // Try to find meta price
        const metaPrice = $('meta[property="product:price:amount"]').attr('content');
        if (metaPrice) return parseFloat(metaPrice);

        // Try common classes
        const priceText = $('.price, .product-price, .offer-price, .current-price').first().text();
        return this.parsePrice(priceText);
    }
}
