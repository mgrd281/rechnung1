/**
 * Storefront Analytics Tracker
 * Captures page views, product views, and cart actions.
 * Version: 2.1.0
 */
(function () {
    // Get script origin to ensure we point to the correct backend even from Shopify domains
    const scriptSrc = document.currentScript?.src;
    const baseOrigin = scriptSrc ? new URL(scriptSrc).origin : '';
    const TRACKER_ENDPOINT = baseOrigin ? `${baseOrigin}/api/analytics/track` : '/api/analytics/track';

    // RADICAL: Immediate block check
    const checkBlockStatus = () => {
        if (sessionStorage.getItem('is_blocked') === 'true' && !window.location.href.includes('/blocked')) {
            console.warn('[Security] Access restricted. Redirecting...');
            window.location.href = `${baseOrigin}/blocked`;
            // Block further execution if possible
            throw new Error('Access Blocked');
        }
    };
    checkBlockStatus();


    let organizationId = '';
    let isInit = false;
    let isReturning = false;

    const initTracker = async () => {
        if (organizationId && isInit) return true;

        try {
            // 1. Identify shop domain
            const shop = window.Shopify?.shop || window.location.hostname;

            // 2. Proactive Security Check
            const securityCheck = await fetch(`${baseOrigin}/api/security/check?shop=${shop}`);
            const securityData = await securityCheck.json();

            if (securityData.ok && securityData.blocked) {
                console.warn('[Security] IP Address is blocked. enforcing restriction...');
                sessionStorage.setItem('is_blocked', 'true');
                if (securityData.reason) sessionStorage.setItem('block_reason', securityData.reason);
                showBlockOverlay({ reason: securityData.reason });
                return false;
            }

            // 3. Regular Init
            const res = await fetch(`${baseOrigin}/api/analytics/init`);
            const data = await res.json();
            if (data.success && data.organizationId) {
                organizationId = data.organizationId;
                console.log('[Analytics] Initialized with Org ID:', organizationId);
                isInit = true;

                // 4. Initial traffic report
                trackStorefrontVisit(shop);
                return true;
            }
        } catch (e) {
            console.warn('[Analytics] Init sequence failed', e);
        }
        return false;
    };

    const trackStorefrontVisit = (shop) => {
        try {
            fetch(`${baseOrigin}/api/security/track-visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shop,
                    path: window.location.pathname,
                    userAgent: navigator.userAgent
                }),
                keepalive: true
            });
        } catch (e) { }
    };

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const getCartToken = () => {
        return getCookie('cart') || window.ShopifyAnalytics?.lib?.user()?.traits()?.cartToken;
    };

    const setCookie = (name, value, days) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    };

    const getOrGenerateToken = (key, length = 32) => {
        try {
            let token = localStorage.getItem(key) || getCookie(key);
            if (!token) {
                token = Array.from(crypto.getRandomValues(new Uint8Array(length)))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                localStorage.setItem(key, token);
                setCookie(key, token, 365);
                isReturning = false;
            } else {
                isReturning = true;
            }
            return token;
        } catch (e) {
            return 'fallback_token_' + Math.random().toString(36).substr(2, 9);
        }
    };

    const getUrlParam = (name) => {
        try {
            return new URLSearchParams(window.location.search).get(name);
        } catch (e) { return null; }
    };

    const SESSION_TIMEOUT = 90 * 1000; // 90 seconds (Radical)

    const getSessionId = () => {
        try {
            const now = Date.now();
            let sId = sessionStorage.getItem('s_id');
            let lastActive = parseInt(localStorage.getItem('s_last_active') || '0');

            // NEW: If session expired (90s) OR no ID => Generate fresh one
            if (!sId || (now - lastActive > SESSION_TIMEOUT)) {
                sId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                sessionStorage.setItem('s_id', sId);
                console.log(`[Analytics] New Session Started: ${sId}`);
                window._isNewSession = true;
            }

            localStorage.setItem('s_last_active', now.toString());
            return sId;
        } catch (e) {
            return 's_rb_' + Math.random().toString(36).substr(2, 9);
        }
    };

    const visitorToken = getOrGenerateToken('v_token');
    let sessionId = getSessionId();

    const getUtms = () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                utmSource: urlParams.get('utm_source'),
                utmMedium: urlParams.get('utm_medium'),
                utmCampaign: urlParams.get('utm_campaign'),
                utmTerm: urlParams.get('utm_term'),
                utmContent: urlParams.get('utm_content')
            };
        } catch (e) {
            return {};
        }
    };

    // Proactive Cart Fetch (Shopify API)
    const fetchCart = async () => {
        try {
            const resp = await fetch('/cart.js');
            const cart = await resp.json();
            return {
                itemsCount: cart.item_count,
                totalValue: cart.total_price / 100,
                currency: cart.currency,
                items: cart.items.map(item => ({
                    id: item.variant_id || item.id,
                    title: item.product_title,
                    price: item.price / 100,
                    qty: item.quantity,
                    image: item.image,
                    url: item.url
                }))
            };
        } catch (e) {
            return null;
        }
    };

    const syncSessionToShopify = async () => {
        if (window._sessionSynced) return;
        try {
            await fetch('/cart/update.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attributes: {
                        '_visitor_session_id': sessionId,
                        '_visitor_token': visitorToken
                    }
                })
            });
            window._sessionSynced = true;
            console.log('[Analytics] Session synced to Shopify cart attributes');
        } catch (e) {
            console.error('[Analytics] Failed to sync session to Shopify', e);
        }
    };

    const track = async (event, metadata = {}) => {
        if (!isInit) {
            await initTracker();
        }

        if (!organizationId) {
            // Retry one more time from DOM in case it appeared late
            organizationId = window.STORE_ORG_ID || document.querySelector('meta[name="organization-id"]')?.content || '';
            if (!organizationId) return;
        }

        const commerceEvents = ['add_to_cart', 'remove_from_cart', 'update_cart', 'view_cart', 'start_checkout', 'view_product'];
        const isCommerce = commerceEvents.includes(event);

        // Auto-enrich with cart snapshot for relevant events
        if (isCommerce && event !== 'view_product') {
            // ONLY fetch if not already provided (Fix for stale data on removals)
            if (!metadata.cart) {
                const cartData = await fetchCart();
                if (cartData) {
                    metadata.cart = cartData;
                    // Proactively record snapshot
                    try {
                        fetch(`${baseOrigin}/api/analytics/sessions/${sessionId}/cart`, {
                            method: 'POST',
                            body: JSON.stringify({ ...cartData, action: event.toUpperCase() }),
                            keepalive: true
                        });
                    } catch (e) { }
                }
            } else {
                // Even if provided, we might want to sync snapshot alongside event
                try {
                    fetch(`${baseOrigin}/api/analytics/sessions/${sessionId}/cart`, {
                        method: 'POST',
                        body: JSON.stringify({ ...metadata.cart, action: event.toUpperCase() }),
                        keepalive: true
                    });
                } catch (e) { }
            }
        }

        // Helper to get detailed device info
        const getDetailedDeviceInfo = () => {
            const ua = navigator.userAgent;
            let browser = "Unknown";
            let browserVersion = "Unknown";
            let os = "Unknown";
            let osVersion = "Unknown";

            // Browser detection
            if (ua.includes("Firefox/")) {
                browser = "Firefox";
                browserVersion = ua.split("Firefox/")[1];
            } else if (ua.includes("Edg/")) {
                browser = "Edge";
                browserVersion = ua.split("Edg/")[1];
            } else if (ua.includes("Chrome/")) {
                browser = "Chrome";
                browserVersion = ua.split("Chrome/")[1].split(" ")[0];
            } else if (ua.includes("Safari/")) {
                browser = "Safari";
                browserVersion = ua.split("Version/")[1]?.split(" ")[0] || "Unknown";
            }

            // OS detection
            if (ua.includes("Windows NT")) {
                os = "Windows";
                osVersion = ua.split("Windows NT ")[1].split(";")[0];
            } else if (ua.includes("Mac OS X")) {
                os = "macOS";
                osVersion = ua.split("Mac OS X ")[1].split(")")[0].replace(/_/g, '.');
            } else if (ua.includes("Android")) {
                os = "Android";
                osVersion = ua.split("Android ")[1].split(";")[0];
            } else if (ua.includes("iPhone OS")) {
                os = "iOS";
                osVersion = ua.split("iPhone OS ")[1].split(" ")[0].replace(/_/g, '.');
            }

            return { browser, browserVersion, os, osVersion };
        };

        const getIdentity = () => {
            try {
                const shopifyCustomer = window.ShopifyAnalytics?.lib?.user()?.traits() || {};
                return {
                    name: shopifyCustomer.firstName ? `${shopifyCustomer.firstName} ${shopifyCustomer.lastName || ''}`.trim() : null,
                    email: shopifyCustomer.email || null
                };
            } catch (e) { return { name: null, email: null }; }
        };

        const device = getDetailedDeviceInfo();
        const identity = getIdentity();

        const payload = JSON.stringify({
            event,
            url: window.location.href,
            path: window.location.pathname,
            visitorToken,
            sessionId,
            organizationId,
            isReturning,
            cartToken: getCartToken(),
            checkoutToken: window.Shopify?.Checkout?.token || window.Shopify?.checkout?.token || window.ShopifyAnalytics?.lib?.user()?.traits()?.checkoutToken,
            referrer: document.referrer,
            ...getUtms(),
            ...device,
            visitorName: identity.name,
            visitorEmail: identity.email,
            metadata
        });

        // RADICAL: Immediate delivery for commerce events
        if (isCommerce || metadata?.isUnloading || (navigator.sendBeacon && event === 'session_end')) {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(TRACKER_ENDPOINT, payload);
            } else {
                fetch(TRACKER_ENDPOINT, { method: 'POST', body: payload, mode: 'cors', headers: { 'Content-Type': 'application/json' } });
            }
            return;
        }

        try {
            const res = await fetch(TRACKER_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: payload
            });
            const data = await res.json();
            if (data.actions) handleServerActions(data.actions);
        } catch (e) { }
    };

    // Server Action Handler
    const handleServerActions = (actions) => {
        actions.forEach(action => {
            console.log('[Analytics] Execute Action:', action.type);
            if (action.type === 'SHOW_COUPON') showCouponPopup(action.payload);
            if (action.type === 'BLOCK_VISITOR') showBlockOverlay(action.payload);
        });
    };

    // Block Overlay
    const showBlockOverlay = (data) => {
        if (document.getElementById('security-block-overlay')) return;

        // Persist block status for this session to avoid flickering on page changes
        sessionStorage.setItem('is_blocked', 'true');
        if (data.reason) sessionStorage.setItem('block_reason', data.reason);

        const overlay = document.createElement('div');
        overlay.id = 'security-block-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: #0f172a;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999999;
            font-family: -apple-system, sans-serif;
            padding: 40px;
            text-align: center;
        `;

        overlay.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 50%; margin-bottom: 24px;">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h1 style="font-size: 32px; font-weight: 900; margin-bottom: 16px;">Zugriff Verweigert</h1>
            <p style="font-size: 18px; opacity: 0.7; max-width: 500px; line-height: 1.6; margin-bottom: 32px;">
                Der Zugriff auf diesen Store wurde aus Sicherheitsgründen für Ihre IP-Adresse gesperrt.<br>
                <span style="font-size: 14px; opacity: 0.5;">Grund: ${data.reason || sessionStorage.getItem('block_reason') || 'Sicherheitsrichtlinie'}</span>
            </p>
            <div style="height: 1px; width: 100px; background: rgba(255,255,255,0.1); margin-bottom: 32px;"></div>
            <p style="font-size: 12px; opacity: 0.4;">Security Protected by invoice Enterprise</p>
        `;

        document.documentElement.innerHTML = `
            <head>
                <title>Zugriff Verweigert</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="margin:0; padding:0; overflow:hidden;">
            </body>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    };

    // Immediate local check on script load
    if (sessionStorage.getItem('is_blocked') === 'true') {
        setTimeout(() => showBlockOverlay({ reason: sessionStorage.getItem('block_reason') }), 0);
    }

    // Modern Coupon Popup
    const showCouponPopup = (data) => {
        if (document.getElementById('live-coupon-popup')) return;

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            #live-coupon-popup {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 380px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                overflow: hidden;
                animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                opacity: 0;
                transform: translateY(20px);
                animation-fill-mode: forwards;
            }
            @keyframes slideIn {
                to { opacity: 1; transform: translateY(0); }
            }
            .lcp-header {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                padding: 24px;
                color: white;
                position: relative;
            }
            .lcp-close {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                transition: background 0.2s;
            }
            .lcp-close:hover { background: rgba(255,255,255,0.4); }
            .lcp-title {
                font-size: 20px;
                font-weight: 800;
                margin: 0 0 8px 0;
                line-height: 1.2;
            }
            .lcp-desc {
                font-size: 14px;
                opacity: 0.9;
                margin: 0;
                line-height: 1.4;
            }
            .lcp-body {
                padding: 24px;
                text-align: center;
            }
            .lcp-code-box {
                background: #f8fafc;
                border: 2px dashed #cbd5e1;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 20px;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            .lcp-code-box:hover {
                border-color: #2563eb;
                background: #eff6ff;
            }
            .lcp-code-label {
                display: block;
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                font-weight: 700;
                margin-bottom: 4px;
            }
            .lcp-code {
                font-size: 24px;
                font-weight: 900;
                color: #0f172a;
                letter-spacing: 2px;
                font-family: monospace;
            }
            .lcp-btn {
                width: 100%;
                background: #0f172a;
                color: white;
                border: none;
                padding: 14px;
                border-radius: 10px;
                font-weight: 700;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.1s;
            }
            .lcp-btn:hover {
                transform: scale(1.02);
                background: #1e293b;
            }
            .lcp-btn:active { transform: scale(0.98); }
            .lcp-copy-toast {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s;
            }
            .lcp-code-box.copied .lcp-copy-toast { opacity: 1; }
        `;
        document.head.appendChild(style);

        const popup = document.createElement('div');
        popup.id = 'live-coupon-popup';
        popup.innerHTML = `
            <div class="lcp-header">
                <button class="lcp-close">✕</button>
                <h3 class="lcp-title">${data.title}</h3>
                <p class="lcp-desc">${data.description}</p>
            </div>
            <div class="lcp-body">
                <div class="lcp-code-box" id="lcp-trigger">
                    <span class="lcp-code-label">Gutscheincode</span>
                    <div class="lcp-code">${data.code}</div>
                    <div class="lcp-copy-toast">Kopiert!</div>
                </div>
                <button class="lcp-btn" id="lcp-btn">Jetzt Einlösen & Sparen</button>
            </div>
        `;

        document.body.appendChild(popup);

        // Interaction
        const closeBtn = popup.querySelector('.lcp-close');
        const codeBox = popup.querySelector('#lcp-trigger');
        const actionBtn = popup.querySelector('#lcp-btn');

        const close = () => {
            popup.style.animation = 'none';
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(20px)';
            popup.style.transition = 'all 0.3s';
            setTimeout(() => popup.remove(), 300);
        };

        const copy = () => {
            navigator.clipboard.writeText(data.code);
            codeBox.classList.add('copied');
            setTimeout(() => codeBox.classList.remove('copied'), 2000);
        };

        closeBtn.onclick = close;
        codeBox.onclick = copy;
        actionBtn.onclick = () => {
            copy();
            // Optionally redirect or close
            close();
        };
    };

    const RECORD_ENDPOINT = baseOrigin ? `${baseOrigin}/api/analytics/record` : '/api/analytics/record';
    let rrwebEvents = [];

    const loadRRWeb = () => {
        if (window.rrweb) {
            console.log('[Analytics] rrweb already loaded');
            return startRecording();
        }
        console.log('[Analytics] Loading rrweb...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js';
        script.onload = () => {
            console.log('[Analytics] rrweb script loaded successfully');
            startRecording();
        };
        script.onerror = (err) => console.error('[Analytics] Failed to load rrweb script', err);
        document.head.appendChild(script);
    };

    const startRecording = () => {
        if (!window.rrweb) {
            console.error('[Analytics] rrweb global not found even after load');
            return;
        }
        console.log('[Analytics] Starting rrweb recording session:', sessionId);
        try {
            window.rrweb.record({
                emit(event) {
                    rrwebEvents.push(event);
                    // Optimized Flush: Every 100 events or 5 seconds (Time-based flush loop handles the rest)
                    if (rrwebEvents.length >= 100) {
                        console.log(`[Analytics] Buffer Full Flush: ${rrwebEvents.length} events`);
                        flushEvents();
                    }
                },
                checkoutEveryNms: 60 * 1000, // Full snapshot every 60s
            });
            // Time-based flush
            setInterval(() => {
                if (rrwebEvents.length > 0) flushEvents();
            }, 5000);
        } catch (e) {
            console.error('[Analytics] rrweb record error:', e);
        }
    };

    const flushEvents = async (isUnloading = false) => {
        if (rrwebEvents.length === 0) return;
        const eventsToSend = [...rrwebEvents];
        rrwebEvents = [];
        console.log(`[Analytics] Flushing ${eventsToSend.length} events to ${RECORD_ENDPOINT} (isUnloading: ${isUnloading})`);
        try {
            const fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify({
                    sessionId,
                    organizationId,
                    events: eventsToSend
                })
            };

            // Only use keepalive for unload events as it has strict 64KB limits
            if (isUnloading) {
                fetchOptions.keepalive = true;
            }

            const resp = await fetch(RECORD_ENDPOINT, fetchOptions);
            if (!resp.ok) console.warn('[Analytics] Flush failed with status:', resp.status);
        } catch (e) {
            console.error('[Analytics] Flush error:', e);
        }
    };

    // Auto-flush every 5 seconds (Reduced for ultra-live)
    setInterval(flushEvents, 5000);

    // Page Performance Tracking
    const trackPagePerformance = () => {
        try {
            if (!window.performance || !window.performance.getEntriesByType) return;

            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
                const domContentLoaded = Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart);

                track('page_performance', {
                    loadTime,
                    domContentLoaded,
                    isSlow: loadTime > 3000,
                    deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
                });
            }
        } catch (e) {
            console.error('[Analytics] performance tracking error:', e);
        }
    };

    // Mobile Error Detection
    const trackMobileErrors = () => {
        if (!/Mobile|Android|iPhone/i.test(navigator.userAgent)) return;

        window.addEventListener('error', (event) => {
            track('mobile_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        }, true);
    };

    // Goal Tracking Helper
    window.trackGoal = (goalType, goalValue = null, metadata = {}) => {
        track('goal_complete', {
            goalType,
            goalValue,
            ...metadata
        });
    };

    // Auto-detect WhatsApp clicks
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && target.href && target.href.includes('wa.me')) {
            window.trackGoal('whatsapp_click', null, { url: target.href });
        }
    }, true);

    // Auto-detect form submissions
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form && form.tagName === 'FORM') {
            window.trackGoal('form_submit', null, {
                formId: form.id,
                formAction: form.action,
                formMethod: form.method
            });
        }
    }, true);

    // Page Load complete - track performance
    if (document.readyState === 'complete') {
        trackPagePerformance();
    } else {
        window.addEventListener('load', trackPagePerformance);
    }

    // Enable mobile error tracking
    trackMobileErrors();

    // IP Detection Helper (As requested in screenshots)
    window.fetchIpDetails = async () => {
        try {
            const res = await fetch('https://api64.ipify.org?format=json');
            const data = await res.json();
            track('ip_detection', { ip: data.ip });
            return data.ip;
        } catch (e) { return null; }
    };

    // Proactive 404 Detection
    const detect404 = () => {
        const is404Title = document.title.toLowerCase().includes('404') ||
            document.title.toLowerCase().includes('not found') ||
            document.title.toLowerCase().includes('nicht gefunden');

        const isShopify404 = window.Shopify?.template === '404' ||
            window.meta?.page?.pageType === '404';

        if (is404Title || isShopify404) {
            console.log('[Analytics] 404 Page Detected');
            track('404', {
                url: window.location.href,
                path: window.location.pathname,
                referrer: document.referrer
            });
        }
    };

    // Initial Tracking Pipeline
    if (window._isNewSession) track('session_start');
    track('page_view');
    detect404();
    loadRRWeb();

    // Heartbeat every 5 seconds (High Frequency for Stability)
    setInterval(() => {
        track('heartbeat');
        localStorage.setItem('s_last_active', Date.now().toString());
        // console.log('[Analytics] ❤️ Heartbeat Sent');
    }, 5000);

    // Visibility / Activity Tracking
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            track('session_idle');
        } else {
            track('session_active');
        }
    });

    // Proactive Exit Tracking
    const handleExit = () => {
        console.log('[Analytics] Exit detected, sending session_ended');
        track('session_ended', { reason: 'exit', isUnloading: true });
        flushEvents(true);
    };

    window.addEventListener('pagehide', handleExit);
    window.addEventListener('beforeunload', (e) => {
        // Fallback for some browsers, but don't double-track if pagehide already fired
        if (!window._exitTracked) {
            window._exitTracked = true;
            handleExit();
        }
    });

    // Track Product View (Enhanced for Shopify)
    const observeProduct = () => {
        if (window.ShopifyAnalytics?.meta?.product) {
            const p = window.ShopifyAnalytics.meta.product;
            track('view_product', {
                productId: p.id,
                title: p.product_title || p.gid || p.id,
                price: p.variants?.[0]?.price ? p.variants[0].price / 100 : 0,
                vendor: p.vendor,
                type: p.type,
                image: document.querySelector('meta[property="og:image"]')?.content
            });
        }
    };
    setTimeout(observeProduct, 1500);

    // Rage Click Detection
    let clicks = [];
    document.addEventListener('click', (e) => {
        const now = Date.now();
        clicks.push({ t: now, x: e.clientX, y: e.clientY });
        clicks = clicks.filter(c => now - c.t < 1000);
        if (clicks.length >= 5) {
            track('rage_click', { count: clicks.length });
            clicks = [];
        }
    });

    // Smart Cart & Checkout Interception (Enhanced for realtime removal detection)
    const interceptCart = () => {
        const originalFetch = window.fetch;

        window.fetch = async function (...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';

            // BEFORE the fetch: Capture current cart state for cart-modifying calls
            let cartBefore = null;
            const isCartModify = url.includes('/cart/change') || url.includes('/cart/update');
            const isCartClear = url.includes('/cart/clear');

            if (isCartModify || isCartClear) {
                try {
                    const resp = await originalFetch.call(this, '/cart.js');
                    cartBefore = await resp.json();
                    console.log('[Analytics] Pre-fetch cart state captured:', cartBefore?.item_count, 'items');
                } catch (e) {
                    console.warn('[Analytics] Failed to capture pre-cart state:', e);
                }
            }

            // Execute the original fetch
            const result = await originalFetch.apply(this, args);

            // AFTER: Analyze the result
            try {
                if (result.ok) {
                    if (url.includes('/cart/add')) {
                        track('add_to_cart');
                    }

                    if ((isCartModify || isCartClear) && cartBefore) {
                        // Clone the response to read it without consuming
                        const cloned = result.clone();
                        let cartAfter = { item_count: 0, total_price: 0, items: [], currency: 'EUR' }; // Default for clear

                        if (!isCartClear) {
                            cartAfter = await cloned.json();
                        }

                        // Detect FULLY removed items (no longer in cart)
                        const removedItems = (cartBefore.items || []).filter(oldItem =>
                            !(cartAfter.items || []).some(newItem =>
                                newItem.variant_id === oldItem.variant_id
                            )
                        ).map(item => ({
                            id: item.variant_id,
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            title: item.product_title,
                            variant_title: item.variant_title,
                            quantity: item.quantity,
                            price: item.price / 100,
                            image: item.image,
                            url: item.url,
                            removedAt: new Date().toISOString()
                        }));

                        // Detect PARTIAL removals (quantity reduced)
                        const partialRemovals = (cartBefore.items || []).filter(oldItem => {
                            const newItem = (cartAfter.items || []).find(n => n.variant_id === oldItem.variant_id);
                            return newItem && newItem.quantity < oldItem.quantity;
                        }).map(oldItem => {
                            const newItem = cartAfter.items.find(n => n.variant_id === oldItem.variant_id);
                            return {
                                id: oldItem.variant_id,
                                product_id: oldItem.product_id,
                                variant_id: oldItem.variant_id,
                                title: oldItem.product_title,
                                variant_title: oldItem.variant_title,
                                quantity: oldItem.quantity - newItem.quantity, // qty removed
                                price: oldItem.price / 100,
                                image: oldItem.image,
                                url: oldItem.url,
                                removedAt: new Date().toISOString(),
                                isPartialRemoval: true
                            };
                        });

                        const allRemovals = [...removedItems, ...partialRemovals];

                        if (allRemovals.length > 0) {
                            console.log('[Analytics] 🔴 Detected removed items:', allRemovals);

                            // Prepare authoritative cart snapshot from the response
                            const authoritativeCart = {
                                itemsCount: cartAfter.item_count,
                                totalValue: cartAfter.total_price / 100,
                                currency: cartAfter.currency,
                                items: cartAfter.items.map(item => ({
                                    id: item.variant_id,
                                    product_id: item.product_id,
                                    variant_id: item.variant_id,
                                    title: item.product_title,
                                    variant_title: item.variant_title,
                                    qty: item.quantity,
                                    price: item.price / 100,
                                    image: item.image,
                                    url: item.url
                                }))
                            };

                            track('remove_from_cart', {
                                removedItems: allRemovals,
                                cart: authoritativeCart // Pass explicit cart state to avoid re-fetch of stale data
                            });
                        } else {
                            // Prepare authoritative cart snapshot from the response
                            const authoritativeCart = {
                                itemsCount: cartAfter.item_count,
                                totalValue: cartAfter.total_price / 100,
                                currency: cartAfter.currency,
                                items: cartAfter.items.map(item => ({
                                    id: item.variant_id,
                                    product_id: item.product_id,
                                    variant_id: item.variant_id,
                                    title: item.product_title,
                                    variant_title: item.variant_title,
                                    qty: item.quantity,
                                    price: item.price / 100,
                                    image: item.image,
                                    url: item.url
                                }))
                            };

                            track('update_cart', {
                                cart: authoritativeCart // Pass explicit cart state
                            });
                        }
                    }

                    if (url.includes('/checkout')) {
                        track('start_checkout');
                    }
                }
            } catch (e) {
                console.warn('[Analytics] Post-fetch analysis error:', e);
            }

            return result;
        };

        // Track Checkout Buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (!target) return;

            const isCheckout =
                target.name === 'checkout' ||
                target.getAttribute('href')?.includes('/checkout') ||
                target.textContent?.toLowerCase().includes('checkout') ||
                target.textContent?.toLowerCase().includes('kasse');

            if (isCheckout) {
                track('start_checkout', { method: 'click', label: target.textContent?.trim() });

                // Cross-domain continuity: Append tokens to checkout URL if it's a link
                if (target.tagName === 'A' && target.href && !target.href.includes('v_token=')) {
                    const url = new URL(target.href, window.location.origin);
                    url.searchParams.set('v_token', visitorToken);
                    url.searchParams.set('s_id', sessionId);
                    target.href = url.toString();
                }
            }
        });
    }
    interceptCart();

    // Scroll tracking
    let reachedThresholds = new Set();
    window.addEventListener('scroll', () => {
        const h = document.documentElement, b = document.body, st = 'scrollTop', sh = 'scrollHeight';
        const scrollPercent = Math.round((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100);
        [50, 90].forEach(t => {
            if (scrollPercent >= t && !reachedThresholds.has(t)) {
                reachedThresholds.add(t);
                track('scroll_depth', { depth: t });
            }
        });
    });

    window.Analytics = { track };
})();
