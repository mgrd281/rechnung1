export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getShopifySettings } from '@/lib/shopify-settings';

export async function GET(request: NextRequest) {
    try {
        const results: any = {
            shopifyConnection: false,
            shopDomain: null,
            hasAccessToken: false,
            autoSendEmail: false,
            smtpConfigured: false,
            resendConfigured: false,
            digitalProductsCount: 0,
            availableKeysCount: 0,
            totalInvoices: 0,
            invoicesLast24h: 0,
            recentOrders: [],
            recommendations: []
        };

        // 1. Check Shopify Connection
        const shopifyConnection = await prisma.shopifyConnection.findFirst({
            include: { organization: true }
        });

        if (shopifyConnection) {
            results.shopifyConnection = true;
            results.shopDomain = shopifyConnection.shopName;
            results.hasAccessToken = !!shopifyConnection.accessToken;
        }

        // 2. Check Email Settings
        const settings = getShopifySettings();
        results.autoSendEmail = settings.autoSendEmail;
        results.smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
        results.resendConfigured = !!process.env.RESEND_API_KEY;

        // 3. Check Digital Products
        const digitalProducts = await prisma.digitalProduct.count();
        const licenseKeys = await prisma.licenseKey.count();

        results.digitalProductsCount = digitalProducts;
        results.availableKeysCount = licenseKeys;

        // 4. Check Recent Invoices
        const organization = shopifyConnection?.organization || await prisma.organization.findFirst();

        if (organization) {
            results.totalInvoices = await prisma.invoice.count({
                where: { organizationId: organization.id }
            });

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            results.invoicesLast24h = await prisma.invoice.count({
                where: {
                    organizationId: organization.id,
                    createdAt: { gte: yesterday }
                }
            });

            // Get recent orders
            const recentInvoices = await prisma.invoice.findMany({
                where: { organizationId: organization.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    order: true
                }
            });

            results.recentOrders = recentInvoices.map(invoice => ({
                number: invoice.invoiceNumber,
                emailSent: false, // We don't track this currently
                keySent: false
            }));
        }

        // 5. Generate Recommendations
        if (!results.shopifyConnection) {
            results.recommendations.push('Shopify-Verbindung fehlt. Bitte verbinden Sie Ihren Shop.');
        }

        if (!results.autoSendEmail) {
            results.recommendations.push('Auto-Send Email ist deaktiviert. Aktivieren Sie es in den Shopify-Einstellungen.');
        }

        if (!results.smtpConfigured && !results.resendConfigured) {
            results.recommendations.push('Keine E-Mail-Konfiguration gefunden. Konfigurieren Sie SMTP oder Resend API.');
        }

        if (results.digitalProductsCount === 0) {
            results.recommendations.push('Keine digitalen Produkte konfiguriert. Fügen Sie Produkte mit Lizenzschlüsseln hinzu.');
        }

        if (results.digitalProductsCount > 0 && results.availableKeysCount === 0) {
            results.recommendations.push('Digitale Produkte vorhanden, aber keine Lizenzschlüssel verfügbar. Fügen Sie Keys hinzu.');
        }

        return NextResponse.json(results);

    } catch (error: any) {
        console.error('Diagnostic error:', error);
        return NextResponse.json(
            { error: error.message || 'Diagnostic failed' },
            { status: 500 }
        );
    }
}
