
import { prisma } from "./lib/prisma";
import { ShopifyAPI } from "./lib/shopify-api";

async function main() {
    try {
        // 1. Find the invoice
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: "#3533" },
            include: { order: true }
        });

        if (!invoice) {
            console.log("Invoice #3533 not found");
            return;
        }

        console.log("Found Invoice:", invoice.id);
        const shopifyOrderId = invoice.order?.shopifyOrderId;

        if (!shopifyOrderId) {
            console.log("No Shopify Order ID linked");
            return;
        }

        console.log("Shopify Order ID:", shopifyOrderId);

        // 2. Try to refund/cancel
        const shopify = new ShopifyAPI();

        console.log("Attempting fullyRefundOrder...");
        try {
            const result = await shopify.fullyRefundOrder(parseInt(shopifyOrderId));
            console.log("Result:", JSON.stringify(result, null, 2));
        } catch (error: any) {
            console.error("Error refunding:", error.message || error);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
