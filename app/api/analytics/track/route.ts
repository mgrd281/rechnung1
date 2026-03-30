import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDeviceInfo } from '@/lib/device-detection';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        if (process.env.DISABLE_ANALYTICS === 'true') {
            return NextResponse.json({ success: true, message: 'Analytics disabled' });
        }
        const body = await req.json();
        const {
            event,
            url,
            path,
            visitorToken,
            sessionId,
            organizationId,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,
            isReturning,
            cartToken,
            checkoutToken,
            browser,
            browserVersion,
            os,
            osVersion,
            visitorName,
            visitorEmail,
            metadata
        } = body;

        if (!organizationId || !visitorToken || !sessionId || !event) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const ua = req.headers.get('user-agent') || '';
        const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0';
        const ip = rawIp.split(',')[0].trim();

        const isIPv6 = ip.includes(':');
        const ipv4 = isIPv6 ? (metadata?.ip || undefined) : ip;
        const ipv6 = isIPv6 ? ip : undefined;

        console.log(`[IP DEBUG] Incoming IP: ${ip} for Org: ${organizationId}`);

        // 0. Check for Blocked IP
        const isSafeIp = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip === '0.0.0.0';

        const isBlocked = isSafeIp ? null : await prisma.blockedIp.findFirst({
            where: {
                organizationId,
                OR: [
                    { ipAddress: ip },
                    {
                        ipAddress: {
                            in: [
                                ip.split('.').slice(0, 3).join('.') + '.0',
                                ip.split(':').slice(0, 3).join(':') + '::0'
                            ]
                        }
                    }
                ]
            }
        });

        if (isBlocked) {
            console.warn(`[IP DEBUG] BLOCK TRIGGERED for IP: ${ip}`);
            // Update session status to BLOCKED in database for "Live Events" visibility
            await prisma.visitorSession.upsert({
                where: { sessionId },
                update: { status: 'BLOCKED', lastActiveAt: new Date() },
                create: {
                    sessionId,
                    visitorId: 'blocked-temporary', // Placeholder or find actual
                    organizationId,
                    status: 'BLOCKED',
                    entryUrl: url,
                    ipMasked: ip.split('.').slice(0, 3).join('.') + '.0'
                }
            }).catch(() => { }); // Ignore upsert errors for blocked users

            return NextResponse.json({
                success: false,
                actions: [{
                    type: 'BLOCK_VISITOR',
                    payload: { reason: isBlocked.reason || 'Security Policy' }
                }]
            });
        }

        // Mask IP for privacy (GDPR)
        let maskedIp = '0.0.0.0';
        if (ip.includes('.')) {
            maskedIp = ip.split('.').slice(0, 3).join('.') + '.0';
        } else if (ip.includes(':')) {
            maskedIp = ip.split(':').slice(0, 3).join(':') + '::0';
        }
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

        const deviceInfo = parseDeviceInfo(ua);

        // Geo-IP Extraction
        let country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || 'DE';
        let city = req.headers.get('cf-ipcity') || req.headers.get('x-vercel-ip-city') || undefined;
        let region = req.headers.get('cf-region') || req.headers.get('x-vercel-ip-region') || undefined;

        // Fallback Geo-IP
        if (!city && ip !== '0.0.0.0' && !ip.startsWith('127.') && !ip.startsWith('192.168.')) {
            try {
                const geoResp = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city`);
                if (geoResp.ok) {
                    const geoData = await geoResp.json();
                    if (geoData.status === 'success') {
                        city = geoData.city;
                        region = geoData.regionName;
                        country = geoData.countryCode;
                    }
                }
            } catch (e) { }
        }

        // Traffic Source
        const getTrafficSource = () => {
            if (utmSource) return { label: utmSource, medium: utmMedium || 'cpc' };
            if (!referrer) return { label: 'Direct', medium: 'direct' };
            try {
                const host = new URL(referrer).hostname.toLowerCase();
                if (host.includes('google.')) return { label: 'Google Organic', medium: 'organic' };
                return { label: host, medium: 'referral' };
            } catch (e) { return { label: 'Referral', medium: 'referral' }; }
        };
        const source = getTrafficSource();

        // 1. Ensure Visitor exists
        const visitor = await prisma.visitor.upsert({
            where: { visitorToken },
            update: { ipHash, country: country || undefined, ipv4: ipv4 || undefined, ipv6: ipv6 || undefined },
            create: {
                visitorToken,
                organizationId,
                ipHash,
                userAgent: ua,
                deviceType: deviceInfo.device.toLowerCase(),
                os: deviceInfo.os,
                browser: deviceInfo.browser,
                country: country || undefined,
                ipv4: ipv4 || undefined,
                ipv6: ipv6 || undefined,
            }
        });

        // 2. Upsert Session
        const session = await prisma.visitorSession.upsert({
            where: { sessionId },
            update: {
                lastActiveAt: new Date(),
                status: event === 'session_ended' ? 'ENDED' : 'ACTIVE',
                cartToken: cartToken || undefined,
                checkoutToken: checkoutToken || undefined,
                city: city || undefined,
                region: region || undefined,
                ipMasked: maskedIp,
                ipv4: ipv4 || undefined,
                ipv6: ipv6 || undefined,
            },
            create: {
                sessionId,
                visitorId: visitor.id,
                organizationId,
                status: 'ACTIVE',
                entryUrl: url,
                deviceType: deviceInfo.device.toLowerCase(),
                os: os || deviceInfo.os,
                browser: browser || deviceInfo.browser,
                sourceLabel: source.label,
                sourceMedium: source.medium,
                city: city || undefined,
                region: region || undefined,
                ipMasked: maskedIp,
                ipv4: ipv4 || undefined,
                ipv6: ipv6 || undefined,
            }
        });

        // 4. Log Event
        if (event !== 'heartbeat') {
            await prisma.sessionEvent.create({
                data: {
                    sessionId: session.id,
                    type: event,
                    url,
                    path,
                    metadata: metadata || {},
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Analytics Tracker] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
