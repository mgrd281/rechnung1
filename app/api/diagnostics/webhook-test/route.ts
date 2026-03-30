export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleOrderCreate } from '@/lib/shopify-order-handler';
import { ShopifyAPI } from '@/lib/shopify-api';

/**
 * WEBHOOK FLOW DIAGNOSTIC ENDPOINT
 * 
 * This endpoint helps diagnose why orders may not be appearing as invoices,
 * why emails are not sent, and why digital keys are not delivered.
 * 
 * GET: Run full diagnostic check
 * POST: Process a specific order manually
 */

async function runDiagnostics() {
    const results: {
        checks: Array<{ name: string; status: 'pass' | 'fail' | 'warn'; message: string }>;
        summary: { passed: number; failed: number; warnings: number };
    } = {
        checks: [],
        summary: { passed: 0, failed: 0, warnings: 0 }
    };

    // Check 1: Database Connection
    try {
        const orgCount = await prisma.organization.count();
        if (orgCount > 0) {
            results.checks.push({ name: 'Database Connection', status: 'pass', message: `Connected. ${orgCount} organization(s) found.` });
        } else {
            results.checks.push({ name: 'Database Connection', status: 'fail', message: 'No organizations found. Invoices cannot be created.' });
        }
    } catch (e: any) {
        results.checks.push({ name: 'Database Connection', status: 'fail', message: `Database error: ${e.message}` });
    }

    // Check 2: SMTP Configuration
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const smtpHost = process.env.SMTP_HOST;
    const devMode = process.env.EMAIL_DEV_MODE === 'true';
    const resendKey = process.env.RESEND_API_KEY;

    if (devMode) {
        results.checks.push({ name: 'Email Mode', status: 'warn', message: 'EMAIL_DEV_MODE=true - Emails are SIMULATED, not sent!' });
    } else if (resendKey) {
        results.checks.push({ name: 'Email Provider', status: 'pass', message: 'Resend API configured.' });
    } else if (smtpUser && smtpPass && smtpHost) {
        results.checks.push({ name: 'SMTP Config', status: 'pass', message: `SMTP configured: ${smtpHost} with user ${smtpUser.substring(0, 5)}...` });
    } else {
        const missing: string[] = [];
        if (!smtpHost) missing.push('SMTP_HOST');
        if (!smtpUser) missing.push('SMTP_USER/EMAIL_USER');
        if (!smtpPass) missing.push('SMTP_PASS/EMAIL_PASS');
        results.checks.push({ name: 'SMTP Config', status: 'fail', message: `Missing: ${missing.join(', ')}. Emails will FAIL!` });
    }

    // Check 3: Shopify Connection
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shopifyDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    const shopifySecret = process.env.SHOPIFY_API_SECRET;

    if (shopifyToken && shopifyDomain) {
        results.checks.push({ name: 'Shopify API', status: 'pass', message: `Shop: ${shopifyDomain}` });

        // Test API access
        try {
            const api = new ShopifyAPI();
            const orders = await api.getOrders({ limit: 1 });
            results.checks.push({ name: 'Shopify API Access', status: 'pass', message: `API working. Retrieved ${orders.length} test order(s).` });
        } catch (e: any) {
            results.checks.push({ name: 'Shopify API Access', status: 'fail', message: `API error: ${e.message}` });
        }
    } else {
        results.checks.push({ name: 'Shopify API', status: 'fail', message: 'Missing SHOPIFY_ACCESS_TOKEN or SHOPIFY_SHOP_DOMAIN' });
    }

    if (!shopifySecret) {
        results.checks.push({ name: 'Webhook Security', status: 'warn', message: 'SHOPIFY_API_SECRET not set. Webhook HMAC verification is DISABLED (security risk).' });
    } else {
        results.checks.push({ name: 'Webhook Security', status: 'pass', message: 'SHOPIFY_API_SECRET is configured.' });
    }

    // Check 4: Invoice Template
    try {
        const org = await prisma.organization.findFirst();
        if (org) {
            const template = await prisma.invoiceTemplate.findFirst({
                where: { organizationId: org.id }
            });
            if (template) {
                results.checks.push({ name: 'Invoice Template', status: 'pass', message: `Template "${template.name || template.id}" found.` });
            } else {
                results.checks.push({ name: 'Invoice Template', status: 'fail', message: 'No invoice template found. Invoice creation will FAIL!' });
            }
        }
    } catch (e: any) {
        results.checks.push({ name: 'Invoice Template', status: 'fail', message: `Error: ${e.message}` });
    }

    // Check 5: Recent orders and invoices
    try {
        const recentOrders = await prisma.order.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        });
        const recentInvoices = await prisma.invoice.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        });
        results.checks.push({
            name: 'Recent Activity (24h)',
            status: recentOrders > 0 || recentInvoices > 0 ? 'pass' : 'warn',
            message: `${recentOrders} orders, ${recentInvoices} invoices in last 24 hours.`
        });
    } catch (e: any) {
        results.checks.push({ name: 'Recent Activity', status: 'fail', message: `Error: ${e.message}` });
    }

    // Check 6: Digital Products
    try {
        const digitalProducts = await prisma.digitalProduct.count();
        const availableKeys = await prisma.licenseKey.count({ where: { isUsed: false } });
        if (digitalProducts > 0) {
            results.checks.push({
                name: 'Digital Products',
                status: availableKeys > 0 ? 'pass' : 'warn',
                message: `${digitalProducts} products configured, ${availableKeys} keys available.`
            });
        } else {
            results.checks.push({ name: 'Digital Products', status: 'warn', message: 'No digital products configured.' });
        }
    } catch (e: any) {
        results.checks.push({ name: 'Digital Products', status: 'fail', message: `Error: ${e.message}` });
    }

    // Summary
    results.checks.forEach(c => {
        if (c.status === 'pass') results.summary.passed++;
        else if (c.status === 'fail') results.summary.failed++;
        else results.summary.warnings++;
    });

    return results;
}

export async function GET(request: NextRequest) {
    try {
        const results = await runDiagnostics();

        return NextResponse.json({
            title: 'Webhook & Order Processing Diagnostics',
            timestamp: new Date().toISOString(),
            ...results,
            recommendations: results.summary.failed > 0 ? [
                'Fix all FAILED checks before expecting orders to process correctly.',
                'Check Vercel environment variables if running in production.',
                'Ensure webhooks are registered in Shopify Admin > Settings > Notifications > Webhooks'
            ] : []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { orderNumber, sendEmail = false } = await request.json();

        if (!orderNumber) {
            return NextResponse.json({ error: 'orderNumber is required' }, { status: 400 });
        }

        console.log(`🔧 [MANUAL PROCESS] Processing order ${orderNumber}...`);

        // Fetch order from Shopify
        const api = new ShopifyAPI();
        const searchName = orderNumber.toString().startsWith('#') ? orderNumber : `#${orderNumber}`;
        const orders = await api.getOrders({ name: searchName, status: 'any' });

        if (orders.length === 0) {
            return NextResponse.json({
                error: `Order ${searchName} not found in Shopify.`,
                suggestion: 'Check the order number or try syncing from Shopify Admin.'
            }, { status: 404 });
        }

        const order = orders[0];
        console.log(`📦 Found order: ${order.name} - Financial: ${order.financial_status} - Fulfillment: ${order.fulfillment_status}`);

        // Process the order
        const result = await handleOrderCreate(order, process.env.SHOPIFY_SHOP_DOMAIN || null, sendEmail);

        return NextResponse.json({
            success: true,
            message: `Order ${order.name} processed successfully.`,
            invoice: {
                id: result.id,
                number: result.number,
                status: result.status,
                total: result.total
            },
            emailSent: sendEmail,
            orderDetails: {
                name: order.name,
                financialStatus: order.financial_status,
                fulfillmentStatus: order.fulfillment_status,
                customerEmail: order.email || order.customer?.email
            }
        });

    } catch (error: any) {
        console.error('Manual process error:', error);
        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
