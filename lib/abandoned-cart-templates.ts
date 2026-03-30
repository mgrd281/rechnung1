export interface AbandonedCartEmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    cta: string;
    description: string;
}

export const ABANDONED_CART_TEMPLATES: AbandonedCartEmailTemplate[] = [
    {
        id: 'friendly-reminder',
        name: 'Friendly Reminder',
        subject: 'Haben Sie etwas vergessen? Ihrem Warenkorb bei [ShopName] fehlt etwas...',
        body: `Hallo [CustomerName],

wir haben bemerkt, dass Sie einige großartige Artikel in Ihrem Warenkorb zurückgelassen haben. Wir wollten nur sicherstellen, dass Sie nichts Wichtiges verpassen!

Ihre Auswahl wartet noch auf Sie. Klicken Sie einfach auf den Link unten, um direkt dort fortzufahren, wo Sie aufgehört haben.

Ihr Warenkorb:
[ItemsList]

Wir freuen uns darauf, Ihre Bestellung für Sie vorzubereiten!`,
        cta: 'Jetzt zum Warenkorb zurückkehren',
        description: 'Ideal für den ersten Reminder (ca. 1 Stunde nach Abbruch). Ohne Druck, einfach nur als freundlicher Hinweis.'
    },
    {
        id: 'trust-value',
        name: 'Trust & Quality',
        subject: 'Gute Entscheidung! Ihre Auswahl bei [ShopName] ist fast auf dem Weg.',
        body: `Hallo [CustomerName],

Sie haben Geschmack! Die Artikel in Ihrem Warenkorb gehören zu unseren beliebtesten Produkten.

Warum bei [ShopName] bestellen?
✅ Schneller & sicherer Versand
✅ 30 Tage Rückgaberecht
✅ Exzellenter Kundensupport (DE)

Schließen Sie Ihren Kauf jetzt ab und genießen Sie erstklassige Qualität.`,
        cta: 'Bestellung sicher abschließen',
        description: 'Fokussiert sich auf Vertrauen und Vorteile. Gut geeignet für den zweiten Kontakt (ca. 3-6 Stunden danach).'
    },
    {
        id: 'discount-offer',
        name: 'Incentive (10% Discount)',
        subject: 'Ein kleines Geschenk für Sie: 10% Rabatt auf Ihren Warenkorb!',
        body: `Hallo [CustomerName],

wir möchten Ihnen die Entscheidung etwas erleichtern. Sichern Sie sich jetzt **10% Rabatt** auf Ihre gesamte Bestellung!

Nutzen Sie einfach diesen Gutscheincode an der Kasse:
**[DiscountCode]**

Beeilen Sie sich, dieser Code ist nur für kurze Zeit gültig ([ExpiryTime]).`,
        cta: 'Rabatt jetzt einlösen',
        description: 'Der Klassiker. Bietet einen finanziellen Anreiz, um unentschlossene Kunden zu überzeugen.'
    },
    {
        id: 'urgency-alert',
        name: 'Urgency / Expiry',
        subject: 'Letzte Warnung: Ihr Warenkorb (und Ihr Rabatt) läuft bald ab!',
        body: `Hallo [CustomerName],

nur eine kurze Nachricht: Wir können die Artikel in Ihrem Warenkorb nicht ewig reservieren. Zudem läuft Ihr persönlicher 10% Rabattcode in weniger als [ExpiryHours] Stunden ab.

Sichern Sie sich Ihre Wunschartikel, bevor sie jemand anderes schnappt oder der Code ungültig wird.`,
        cta: 'Warenkorb jetzt retten',
        description: 'Erzeugt Dringlichkeit. Perfekt für den Reminder nach ca. 24 Stunden.'
    },
    {
        id: 'personal-plain',
        name: 'Personal Outreach (Plain Text)',
        subject: 'Kurze Frage zu Ihrer Bestellung bei [ShopName]',
        body: `Hallo [CustomerName],

ich bin [OwnerName] von [ShopName]. Ich habe gesehen, dass Sie Ihren Einkauf fast abgeschlossen hätten, dann aber doch pausiert haben.

Gab es technische Probleme oder haben Sie eine Frage zu einem der Produkte? Antworten Sie einfach auf diese E-Mail – ich helfe Ihnen gerne persönlich weiter.

Falls Sie einfach nur abgelenkt wurden, finden Sie hier Ihren Warenkorb:
[CartUrl]

Herzliche Grüße,
[OwnerName]`,
        cta: 'Zum Warenkorb',
        description: 'Sieht aus wie eine persönliche E-Mail vom Inhaber. Bricht das Muster der Standard-Marketings-Mails und hat oft extrem hohe Öffnungsraten.'
    },
    {
        id: 'low-stock',
        name: 'Scarcity (Low Stock)',
        subject: 'Fast ausverkauft! Die Artikel in Ihrem Warenkorb sind begehrt...',
        body: `Hallo [CustomerName],

wir wollten Sie nur warnen: Die Artikel, die Sie ausgewählt haben, sind aktuell sehr gefragt und unser Lagerbestand ist niedrig.

Wir können nicht garantieren, dass sie noch da sind, wenn Sie das nächste Mal vorbeischauen. Schließen Sie Ihren Kauf jetzt ab, um sicherzugehen.`,
        cta: 'Verfügbarkeit prüfen & Bestellen',
        description: 'Nutzt Verknappung als psychologischen Trigger. Sehr effektiv bei physischen Produkten.'
    },
    {
        id: 'final-chance',
        name: 'Final Call',
        subject: 'Letzte Chance: Wir leeren Ihren Warenkorb in Kürze.',
        body: `Hallo [CustomerName],

dies ist unsere letzte Nachricht bezüglich Ihres aktuellen Warenkorbs. Falls Sie noch Interesse haben, ist dies der letzte Moment, um zuzugreifen.

Wir löschen die Reservierung heute Nacht. Hier ist ein letztes Mal der direkte Zugriff:`,
        cta: 'Jetzt letzte Chance nutzen',
        description: 'Der finale Abschluss. Klare Ansage, dass das Angebot endet.'
    },
    {
        id: 'professional-marketing',
        name: 'Professional Marketing (Product Cards & High Conversion)',
        subject: 'Wartet da noch etwas auf Sie? Ihr persönlicher Warenkorb bei [ShopName]',
        body: `Hallo [CustomerName],

wir haben bemerkt, dass Sie einige großartige Artikel in Ihrem Warenkorb zurückgelassen haben. Wir wollten nur sicherstellen, dass Sie nichts Wichtiges verpassen!

Besonders diese Artikel sind aktuell sehr beliebt:

[CartItemsHTML]

Sichern Sie sich jetzt Ihre Wunschartikel, bevor sie vergriffen sind.`,
        cta: 'Jetzt Bestellung abschließen',
        description: 'Hoch-konvertierendes Marketing-Template mit Produktbildern, Preisen und Trust-Badges. Ideal für den 2. oder 3. Reminder.'
    }
];

export function getPersonalizedTemplate(templateId: string, data: {
    customerName: string,
    shopName: string,
    itemsList: string,
    discountCode?: string,
    expiryTime?: string,
    expiryHours?: string,
    cartUrl: string,
    ownerName?: string
}) {
    const template = ABANDONED_CART_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    let body = template.body
        .replace(/\[CustomerName\]/g, data.customerName || 'Kunde')
        .replace(/\[ShopName\]/g, data.shopName)
        .replace(/\[ItemsList\]/g, data.itemsList)
        .replace(/\[DiscountCode\]/g, data.discountCode || 'WELCOME10')
        .replace(/\[ExpiryTime\]/g, data.expiryTime || '24 Stunden')
        .replace(/\[ExpiryHours\]/g, data.expiryHours || '24')
        .replace(/\[CartUrl\]/g, data.cartUrl)
        .replace(/\[OwnerName\]/g, data.ownerName || 'Ihr Team');

    let subject = template.subject
        .replace(/\[CustomerName\]/g, data.customerName || 'Kunde')
        .replace(/\[ShopName\]/g, data.shopName);

    return {
        ...template,
        subject,
        body
    };
}
