
/**
 * Advanced UTF-8 Repair Logic (Nuclear Version)
 * Fixes strings that have been misinterpreted as Latin1/Windows-1252.
 * 
 * Root Cause: Some systems interpret UTF-8 bytes (like \xE2\x80\x93 for –) 
 * as individual Latin1 characters (â€”).
 */
export function deepRepairUTF8(str: string | null | undefined): string {
    if (!str) return '';

    // 1. Detect common mojibake patterns
    // Patterns like Ã¼ (ü), Ã¤ (ä), â€“ (–), â€” (—), â„¢ (™)
    if (str.includes('Ã') || str.includes('â') || str.includes('©') || str.includes('®')) {
        try {
            // First attempt: Standard byte re-interpretation
            const buf = Buffer.from(str, 'latin1');
            const decoded = buf.toString('utf8');

            // Check if we lost data (U+FFFD replacement chars)
            if (!decoded.includes('')) {
                // If the decoded version is shorter (as expected for multi-byte to single char)
                // and contains recognizable German or punctuation, it's a win.
                if (decoded !== str) return decoded;
            }
        } catch (e) {
            // Fall through
        }
    }

    // 2. Manual fallback for stubborn patterns that buffer.from might miss
    // This handles cases where some characters in the sequence were already "fixed" 
    // or are non-standard latin1 mappings.
    let fixed = str;
    const mappings: [RegExp, string][] = [
        [/â€“/g, '–'], [/â€”/g, '—'], [/â€™/g, '’'], [/â€œ/g, '“'], [/â€/g, '”'],
        [/Ã¤/g, 'ä'], [/Ã¶/g, 'ö'], [/Ã¼/g, 'ü'], [/Ã„/g, 'Ä'], [/Ã–/g, 'Ö'], [/Ãœ/g, 'Ü'], [/ÃŸ/g, 'ß'],
        [/â„¢/g, '™'], [/â€¦/g, '…'], [/Â /g, ' '], [/Â/g, ''],
        [/â\u0080\u008a/g, ' '], // Hair Space
        [/â\u0080\u0093/g, '–'], // En Dash fallback
        [/â\u0080\u0094/g, '—'], // Em Dash fallback
        [/â\u0080\u0099/g, '’'], // Smart quote fallback
        [/â\|\|/g, '|'],         // Custom Shopify pipe corruption
    ];

    for (const [pattern, replacement] of mappings) {
        fixed = fixed.replace(pattern, replacement);
    }

    return fixed;
}

/**
 * Strips literally everything that isn't a valid printable character or a 
 * known useful UTF-8 extension for German/Business.
 */
export function finalSanitize(str: string): string {
    return str
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, '') // Strip control chars & replacement char
        .trim();
}
