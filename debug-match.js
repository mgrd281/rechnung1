
const { ShopifyAPI } = require('./lib/shopify-api');
require('dotenv').config({ path: '.env.local' });

// Copy-paste of the logic from route.ts
function calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Split into words and check overlap
    const words1 = s1.split(/\s+/).filter(w => w.length > 2);
    const words2 = s2.split(/\s+/).filter(w => w.length > 2);

    if (words1.length === 0 || words2.length === 0) return 0;

    const intersection = words1.filter(w => words2.includes(w));
    return intersection.length / Math.max(words1.length, words2.length);
}

async function debugMatch() {
    console.log('Fetching Shopify products...');

    // We need to mock the ShopifyAPI class or import it if it's JS compatible
    // Since it's TS, I'll mock a simple fetch if I can't import easily, 
    // BUT wait, I can try to run this with ts-node if available, or just use the logic on hardcoded strings first.
    // Let's rely on the user having the product.

    // Extracted Title from Vercel Page (based on user screenshot/logs)
    const extractedTitle = "LEGO Icons Botanical Collection (10329)";
    console.log(`Target Title: "${extractedTitle}"`);

    // Fetch actual products using the existing API lib if possible, but it is TS.
    // I will use a simple fetch to the user's shopify API manually or just list probable titles.
    // Better: I will create a TS script and run it with `npx tsx`.
}

console.log("Use debug-match.ts with npx tsx instead.");
