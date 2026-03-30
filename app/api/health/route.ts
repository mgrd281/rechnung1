export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

/**
 * PRODUCTION HEALTH CHECK ENDPOINT
 * 
 * This endpoint checks if all critical environment variables and services are configured.
 * Call this on Railway to diagnose why webhooks aren't processing.
 * 
 * URL: /api/health
 */

interface HealthCheck {
    name: string;
    status: 'ok' | 'error' | 'warning';
    message: string;
    value?: string;
}

export async function GET(request: NextRequest) {
    const checks: HealthCheck[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // 1. DATABASE_URL Check
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        checks.push({
            name: 'DATABASE_URL',
            status: 'ok',
            message: 'Database URL is configured',
            value: dbUrl.split('@')[1]?.split('/')[0] || 'configured' // Show host only
        });

        // Test actual database connection
        try {
            const { prisma } = await import('@/lib/prisma');
            const result = await prisma.$queryRaw`SELECT 1 as test`;
            checks.push({
                name: 'Database Connection',
                status: 'ok',
                message: 'Successfully connected to database'
            });

            // Check for organization
            const orgCount = await prisma.organization.count();
            checks.push({
                name: 'Organization',
                status: orgCount > 0 ? 'ok' : 'error',
                message: orgCount > 0 ? `${orgCount} organization(s) found` : 'No organizations! Invoices cannot be created.',
                value: String(orgCount)
            });

            // Check for invoice template
            if (orgCount > 0) {
                const org = await prisma.organization.findFirst();
                const templateCount = await prisma.invoiceTemplate.count({
                    where: { organizationId: org!.id }
                });
                checks.push({
                    name: 'Invoice Template',
                    status: templateCount > 0 ? 'ok' : 'error',
                    message: templateCount > 0 ? `${templateCount} template(s) found` : 'No invoice templates! Cannot create invoices.',
                    value: String(templateCount)
                });
            }

        } catch (dbError: any) {
            checks.push({
                name: 'Database Connection',
                status: 'error',
                message: `Database error: ${dbError.message}`
            });
            overallStatus = 'unhealthy';
        }
    } else {
        checks.push({
            name: 'DATABASE_URL',
            status: 'error',
            message: '❌ DATABASE_URL is NOT SET! This is critical - add it to Railway Variables!'
        });
        overallStatus = 'unhealthy';
    }

    // 2. Shopify Configuration
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shopifyDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    const shopifyApiSecret = process.env.SHOPIFY_API_SECRET;

    checks.push({
        name: 'SHOPIFY_ACCESS_TOKEN',
        status: shopifyToken ? 'ok' : 'error',
        message: shopifyToken ? 'Configured' : 'Missing!',
        value: shopifyToken ? `${shopifyToken.substring(0, 10)}...` : undefined
    });

    checks.push({
        name: 'SHOPIFY_SHOP_DOMAIN',
        status: shopifyDomain ? 'ok' : 'error',
        message: shopifyDomain ? shopifyDomain : 'Missing!',
        value: shopifyDomain || undefined
    });

    checks.push({
        name: 'SHOPIFY_WEBHOOK_SECRET',
        status: shopifyWebhookSecret ? 'ok' : 'warning',
        message: shopifyWebhookSecret ? 'Configured' : 'Not set - webhook verification disabled',
        value: shopifyWebhookSecret ? `${shopifyWebhookSecret.substring(0, 10)}...` : undefined
    });

    // 3. Email Configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailDevMode = process.env.EMAIL_DEV_MODE;

    if (resendApiKey) {
        checks.push({
            name: 'Email Provider',
            status: 'ok',
            message: 'Resend is configured',
            value: `${resendApiKey.substring(0, 10)}...`
        });
    } else if (smtpUser && smtpPass) {
        checks.push({
            name: 'Email Provider',
            status: 'ok',
            message: 'SMTP is configured',
            value: smtpUser
        });
    } else {
        checks.push({
            name: 'Email Provider',
            status: 'error',
            message: 'No email provider configured! Add RESEND_API_KEY or SMTP credentials.'
        });
        overallStatus = 'unhealthy';
    }

    if (emailDevMode === 'true') {
        checks.push({
            name: 'EMAIL_DEV_MODE',
            status: 'warning',
            message: '⚠️ EMAIL_DEV_MODE=true - Emails are SIMULATED, not actually sent!'
        });
        overallStatus = 'degraded';
    }

    // 4. Recent invoices
    try {
        const { prisma } = await import('@/lib/prisma');
        const recentInvoices = await prisma.invoice.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                invoiceNumber: true,
                createdAt: true,
                status: true,
                customerEmail: true
            }
        });

        checks.push({
            name: 'Recent Invoices',
            status: recentInvoices.length > 0 ? 'ok' : 'warning',
            message: recentInvoices.length > 0
                ? `Found ${recentInvoices.length} recent invoices`
                : 'No invoices found in database',
            value: recentInvoices.map(i => `${i.invoiceNumber} (${i.status})`).join(', ') || undefined
        });
    } catch (e) {
        // Skip if database not available
    }

    // Calculate overall status
    const hasErrors = checks.some(c => c.status === 'error');
    const hasWarnings = checks.some(c => c.status === 'warning');
    if (hasErrors) overallStatus = 'unhealthy';
    else if (hasWarnings && overallStatus !== 'unhealthy') overallStatus = 'degraded';

    return NextResponse.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        checks,
        summary: {
            total: checks.length,
            ok: checks.filter(c => c.status === 'ok').length,
            warnings: checks.filter(c => c.status === 'warning').length,
            errors: checks.filter(c => c.status === 'error').length
        },
        troubleshooting: overallStatus !== 'healthy' ? [
            hasErrors && checks.find(c => c.name === 'DATABASE_URL' && c.status === 'error')
                ? '🚨 Add DATABASE_URL to Railway Variables!'
                : null,
            hasErrors && checks.find(c => c.name === 'Database Connection' && c.status === 'error')
                ? '🚨 Database connection failed - check if DB is online and URL is correct!'
                : null,
            hasErrors && checks.find(c => c.name === 'Organization' && c.status === 'error')
                ? '🚨 No organization in database - run initial setup!'
                : null,
            hasErrors && checks.find(c => c.name === 'Invoice Template' && c.status === 'error')
                ? '🚨 No invoice template - create one in the dashboard!'
                : null,
        ].filter(Boolean) : []
    });
}
