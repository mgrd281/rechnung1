
import { ShopifyAPI } from './lib/shopify-api';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Matching logic from route.ts
// Matching logic from route.ts (IMPROVED)
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[()]/g, '')
    const s2 = str2.toLowerCase().replace(/[()]/g, '')

    if (s1.includes(s2) || s2.includes(s1)) return 0.9

    // Check for matching numbers (IDs, SKUs) - Strong signal
    const nums1 = s1.match(/\d{4,}/g) || []
    const nums2 = s2.match(/\d{4,}/g) || []
    const commonNums = nums1.filter(n => nums2.includes(n))
    if (commonNums.length > 0) return 0.95

    // Split into words and check overlap
    const words1 = s1.split(/\s+/).filter(w => w.length > 2)
    const words2 = s2.split(/\s+/).filter(w => w.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const intersection = words1.filter(w => words2.includes(w))
    return intersection.length / Math.max(words1.length, words2.length)
}

async function run() {
    try {
        console.log("Fetching products...");
        const api = new ShopifyAPI();
        const products = await api.getProducts({ limit: 250 });
        console.log(`Fetched ${products.length} products.`);

        const target = "LEGO Icons Botanical Collection (10329)";
        console.log(`\nMatching against target: "${target}"`);

        let bestMatch = null;
        let highestScore = 0;

        for (const p of products) {
            const score = calculateSimilarity(target, p.title);
            if (score > 0.3) { // Show potential candidates
                console.log(`[${score.toFixed(2)}] ${p.title}`);
            }
            if (score > highestScore) {
                highestScore = score;
                bestMatch = p;
            }
        }

        console.log("\n--- RESULT ---");
        if (bestMatch && highestScore > 0.4) {
            console.log(`✅ MATCH FOUND: ${bestMatch.title} (Score: ${highestScore.toFixed(2)})`);
        } else {
            console.log(`❌ NO MATCH FOUND (Best: ${bestMatch?.title} with Score: ${highestScore.toFixed(2)})`);
        }

    } catch (e) {
        console.error(e);
    }
}

run();
