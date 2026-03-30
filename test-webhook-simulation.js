// Skript zur Simulation eines Shopify Webhooks
// Verwendung: node test-webhook-simulation.js

const fetch = require('node-fetch'); // Stellen Sie sicher, dass node-fetch installiert ist oder verwenden Sie Node 18+

async function simulateWebhook() {
    const orderId = Math.floor(Math.random() * 1000000);
    const orderNumber = `TEST-${orderId}`;

    console.log(`🚀 Starte Webhook-Simulation für Bestellung ${orderNumber}...`);

    const payload = {
        id: orderId,
        order_number: orderNumber,
        email: "test@example.com", // Ändern Sie dies zu Ihrer E-Mail zum Testen
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_price: "119.00",
        currency: "EUR",
        financial_status: "paid", // Wichtig: Muss 'paid' sein für automatische Rechnung
        fulfillment_status: null,
        customer: {
            id: 12345,
            email: "test@example.com",
            first_name: "Max",
            last_name: "Mustermann"
        }
    };

    try {
        const response = await fetch('http://localhost:3000/api/shopify/webhooks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Topic': 'orders/create',
                'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
                // 'X-Shopify-Hmac-Sha256': '...' // Signatur wird im Test-Modus oft übersprungen oder muss generiert werden
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('📡 Status:', response.status);
        console.log('📦 Antwort:', JSON.stringify(data, null, 2));

        if (data.success && data.result && data.result.created) {
            console.log('\n✅ ERFOLG: Rechnung wurde automatisch erstellt!');
            console.log(`   Rechnungs-ID: ${data.result.invoiceId}`);
            console.log('   Prüfen Sie nun Ihre E-Mails (oder die Server-Logs im Dev-Modus).');
        } else if (data.result && data.result.duplicate) {
            console.log('\n⚠️ HINWEIS: Diese Bestellung wurde bereits verarbeitet.');
        } else {
            console.log('\n❌ FEHLER oder ÜBERSPRUNGEN: Überprüfen Sie die Ausgabe oben.');
        }

    } catch (error) {
        console.error('❌ Verbindungsfehler:', error.message);
        console.log('   Stellen Sie sicher, dass der Server auf http://localhost:3000 läuft.');
    }
}

simulateWebhook();
