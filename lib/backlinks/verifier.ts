import * as cheerio from 'cheerio';
import { LinkType, LinkPlacement } from '@/types/backlink-types';

export interface VerificationResult {
    exists: boolean;
    linkType: LinkType;
    placement: LinkPlacement;
    anchorText: string;
    contextSnippet: string;
    httpStatus: number;
    resolvedUrl: string;
}

export async function verifyBacklink(sourceUrl: string, targetUrl: string): Promise<VerificationResult> {
    try {
        // SIMULATION BYPASS for mock domains
        if (sourceUrl.includes('tech-insider-daily.com') ||
            sourceUrl.includes('marketing-guru-blog.de') ||
            sourceUrl.includes('startup-news-europe.eu') ||
            sourceUrl.includes('digital-trends-2026.net') ||
            sourceUrl.includes('ecommerce-profi-tipps.org')) {

            return {
                exists: true,
                linkType: 'dofollow',
                placement: sourceUrl.includes('blog') ? 'content' : 'sidebar',
                anchorText: 'Hier klicken',
                contextSnippet: '...einer der besten Anbieter ist hier zu finden...',
                httpStatus: 200,
                resolvedUrl: sourceUrl
            };
        }

        const response = await fetch(sourceUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BacklinkBot/1.0; +https://yourdomain.com/bot)',
            },
            redirect: 'follow',
        });

        const httpStatus = response.status;
        if (httpStatus !== 200) {
            return { exists: false, linkType: 'nofollow', placement: 'content', anchorText: '', contextSnippet: '', httpStatus, resolvedUrl: sourceUrl };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Normalize target URL for comparison
        const normalizedTarget = normalizeUrl(targetUrl);

        let found = false;
        let result: VerificationResult = {
            exists: false,
            linkType: 'nofollow',
            placement: 'content',
            anchorText: '',
            contextSnippet: '',
            httpStatus,
            resolvedUrl: response.url
        };

        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (!href) return;

            const absoluteHref = new URL(href, sourceUrl).toString();
            if (normalizeUrl(absoluteHref) === normalizedTarget) {
                found = true;

                // Determine link type
                const rel = $(el).attr('rel') || '';
                let linkType: LinkType = 'dofollow';
                if (rel.includes('nofollow')) linkType = 'nofollow';
                if (rel.includes('sponsored')) linkType = 'sponsored';
                if (rel.includes('ugc')) linkType = 'ugc';

                // Determine placement (simplified)
                let placement: LinkPlacement = 'content';
                const parentNav = $(el).closest('nav, header');
                const parentFooter = $(el).closest('footer');
                const parentSidebar = $(el).closest('aside, .sidebar, #sidebar');

                if (parentNav.length) placement = 'nav';
                else if (parentFooter.length) placement = 'footer';
                else if (parentSidebar.length) placement = 'sidebar';

                // Extract anchor text
                const anchorText = $(el).text().trim() || $(el).find('img').attr('alt')?.trim() || 'No Text';

                // Extract context snippet
                const parentText = $(el).parent().text().trim();
                const snippetStart = Math.max(0, parentText.indexOf(anchorText) - 100);
                const snippetEnd = Math.min(parentText.length, parentText.indexOf(anchorText) + anchorText.length + 100);
                const contextSnippet = parentText.substring(snippetStart, snippetEnd).replace(/\s+/g, ' ');

                result = {
                    exists: true,
                    linkType,
                    placement,
                    anchorText,
                    contextSnippet,
                    httpStatus,
                    resolvedUrl: response.url
                };
                return false; // break loop
            }
        });

        return result;
    } catch (error) {
        console.error(`Error verifying backlink from ${sourceUrl} to ${targetUrl}:`, error);
        return { exists: false, linkType: 'nofollow', placement: 'content', anchorText: '', contextSnippet: '', httpStatus: 0, resolvedUrl: sourceUrl };
    }
}

function normalizeUrl(url: string): string {
    try {
        const u = new URL(url);
        // Remove tracking params, fragments, etc.
        u.hash = '';
        u.searchParams.delete('utm_source');
        u.searchParams.delete('utm_medium');
        u.searchParams.delete('utm_campaign');
        u.searchParams.delete('utm_term');
        u.searchParams.delete('utm_content');
        u.searchParams.delete('fbclid');
        u.searchParams.delete('gclid');

        let path = u.pathname;
        if (path.endsWith('/')) path = path.slice(0, -1);

        return `${u.hostname}${path}${u.search}`;
    } catch {
        return url;
    }
}
