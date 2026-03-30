import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
    device: string;
    os: string;
    browser: string;
    ua: string;
    detection_confidence: 'low' | 'high';
    screenWidth?: number;
    screenHeight?: number;
    isTouch?: boolean;
}

/**
 * Robust User Agent Parser
 * Falls back to source_name if UA is missing or generic.
 */
export function parseDeviceInfo(ua: string, sourceName?: string): DeviceInfo {
    const parser = new UAParser(ua);
    const result = parser.getResult();

    let device = 'Desktop';
    let os = result.os.name || 'Unbekannt';
    let browser = result.browser.name || 'Unbekannt';

    // 1. Determine Device Type
    const type = result.device.type;
    if (type === 'mobile' || type === 'tablet' || type === 'wearable' || type === 'embedded') {
        device = type.charAt(0).toUpperCase() + type.slice(1);
    } else if (/mobile|android|iphone|ipad|ipod|phone|blackberry|iemobile|kindle|silk|opera mini|mobi|shopify|fbav|instagram/i.test(ua)) {
        device = 'Mobile';
    } else if (sourceName === 'shopify_draft_order' || sourceName === 'shopify_mobile' || sourceName === 'pos') {
        device = 'Mobile';
    } else if (sourceName === 'web') {
        device = 'Desktop';
    }

    // 2. Specific OS mapping for consistency
    if (os === 'Mac OS') os = 'macOS';

    // 3. Fallback for OS if ua-parser-js fails but we have hints
    if (os === 'Unbekannt') {
        if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
        else if (/android/i.test(ua)) os = 'Android';
        else if (/windows/i.test(ua)) os = 'Windows';
        else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
        else if (/linux/i.test(ua)) os = 'Linux';
    }

    return {
        device,
        os,
        browser,
        ua,
        detection_confidence: 'low'
    };
}
