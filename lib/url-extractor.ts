
import * as cheerio from 'cheerio';

export interface ExtractedContent {
    title: string;
    description: string;
    canonicalUrl: string;
    text: string;
    html: string;
    headings: { level: number; text: string }[];
    images: { url: string; alt: string; src: string }[];
    author?: string;
    publishDate?: string;
}

export async function extractUrlContent(url: string): Promise<ExtractedContent> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove junk
        $('script, style, nav, footer, iframe, ads, .ads, #ads, .cookie-banner, #cookie-banner, .popup, #popup').remove();

        // Metadata
        const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
        const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;
        const author = $('meta[name="author"]').attr('content') || $('[class*="author"], [id*="author"]').first().text().trim();
        const publishDate = $('meta[property="article:published_time"]').attr('content') || $('time').attr('datetime') || '';

        // Headings
        const headings: { level: number; text: string }[] = [];
        $('h1, h2, h3').each((_, el) => {
            headings.push({
                level: parseInt(el.tagName.replace('h', '')),
                text: $(el).text().trim()
            });
        });

        // Images
        const images: { url: string; alt: string; src: string }[] = [];
        $('img').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            const alt = $(el).attr('alt') || '';
            if (src && !src.startsWith('data:')) {
                // Resolve relative URLs
                const absoluteUrl = new URL(src, url).href;
                images.push({ url: absoluteUrl, alt, src });
            }
        });

        // Content Extraction (Basic Readability-like approach)
        // Find the element with the most text/paragraphs
        let mainContent = '';
        let mainElement = $('body');

        const candidates = $('article, main, .content, #content, .post, .article, .entry-content');
        if (candidates.length > 0) {
            mainElement = candidates.first();
        }

        // Clean up common noise in main content
        mainElement.find('button, .social-share, .tags, .categories, .related-posts').remove();

        const text = mainElement.text().replace(/\s+/g, ' ').trim();
        const contentHtml = mainElement.html() || '';

        return {
            title,
            description,
            canonicalUrl,
            text,
            html: contentHtml,
            headings,
            images,
            author,
            publishDate
        };

    } catch (error) {
        console.error('Error extracting URL content:', error);
        throw error;
    }
}
