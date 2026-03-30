
// Re-created debug script
const cheerio = require('cheerio');

async function testVercelImport() {
    const urls = [
        "https://bewertungen.vercel.app/lego_botanical.html"
    ];

    for (const url of urls) {
        console.log(`Testing URL: ${url}`);
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            const scriptSrc = $('script[src^="reviews_data_"]').attr('src');
            if (scriptSrc) {
                console.log(`Found data script: ${scriptSrc}`);
                const jsUrl = new URL(scriptSrc, url).href;
                const jsRes = await fetch(jsUrl);
                const jsContent = await jsRes.text();
                const jsonMatch = jsContent.match(/const REVIEWS_DATA\s*=\s*(\[[\s\S]*?\]);/);

                if (jsonMatch && jsonMatch[1]) {
                    const data = JSON.parse(jsonMatch[1]);
                    console.log(`Total reviews in JS file: ${data.length}`);
                    console.log('First review:', data[0]);
                    console.log('Last review:', data[data.length - 1]);
                }
            } else {
                console.log('No reviews_data script found.');
            }

        } catch (error) {
            console.error(`Error processing ${url}:`, error);
        }
        console.log('---');
    }
}

testVercelImport();
