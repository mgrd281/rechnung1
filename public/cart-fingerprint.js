/**
 * Shopify Cart & Device Fingerprinting Script
 * Tracks Device, OS, and Browser with high confidence.
 */
(function () {
    // Determine our base URL from the script tag that loaded us
    let baseUrl = '';
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src && scripts[i].src.includes('cart-fingerprint.js')) {
            const url = new URL(scripts[i].src);
            baseUrl = url.origin;
            break;
        }
    }

    // Fallback if we can't find ourselves
    if (!baseUrl && typeof window !== 'undefined') {
        // You can hardcode your production URL here as a final fallback
        // baseUrl = 'https://your-app.vercel.app';
    }

    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Desktop';
        let os = 'Unknown';
        let browser = 'Unknown';

        // 1. Tactile/Pointer Detection (Highest Confidence for Mobile)
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
        const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

        if (isTouch || hasCoarsePointer) {
            device = 'Mobile';
        }

        // 2. OS Detection
        if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
        else if (/Android/i.test(ua)) os = 'Android';
        else if (/Win/i.test(ua)) os = 'Windows';
        else if (/Mac/i.test(ua)) os = 'macOS';
        else if (/Linux/i.test(ua)) os = 'Linux';

        // iPad "Request Desktop Site" Fix
        if (os === 'macOS' && isTouch) {
            os = 'iOS';
            device = 'Mobile';
        }

        // Final sanity check for Mobile
        if (device === 'Desktop' && (isTouch || hasCoarsePointer) && window.screen.width < 1024) {
            device = 'Mobile';
        }

        return {
            device,
            os,
            browser,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            isTouch: isTouch,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            ua: ua // Send raw UA for debugging
        };
    }

    function init() {
        // Look for Shopify Checkout Information
        const shopifyCheckout = window.Shopify && window.Shopify.checkout;
        if (!shopifyCheckout || (!shopifyCheckout.id && !shopifyCheckout.token)) {
            // If not found, retry in 2 seconds
            setTimeout(init, 2000);
            return;
        }

        const id = shopifyCheckout.id || shopifyCheckout.token;
        const shop = (window.Shopify && window.Shopify.shop) || window.location.hostname;

        const payload = {
            checkoutId: shopifyCheckout.id,
            checkoutToken: shopifyCheckout.token,
            shopDomain: shop,
            deviceInfo: getDeviceInfo()
        };

        if (!baseUrl) {
            console.error('[Fingerprint] Base URL not found. Please load script with absolute URL.');
            return;
        }

        // Send to our API
        fetch(`${baseUrl}/api/abandoned-carts/device-fingerprint`, {
            method: 'POST',
            mode: 'cors', // Ensure CORS is used
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => console.log('[Fingerprint] Success:', data))
            .catch(err => console.error('[Fingerprint] Error sending data:', err));
    }

    // Run on load
    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();

