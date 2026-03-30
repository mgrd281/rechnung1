# Shopify Webhook Setup für Automatische Rechnungserstellung

## Übersicht
Diese Anleitung zeigt, wie du Shopify Webhooks einrichtest, damit automatisch:
1. ✅ Rechnungen erstellt werden, sobald eine Bestellung eingeht
2. ✅ Rechnungen automatisch per E-Mail an Kunden gesendet werden
3. ✅ Digitale Produktschlüssel automatisch versendet werden

## Webhook-Endpunkte

### 1. Neue Bestellungen (orders/create)
**URL:** `https://deine-domain.de/api/webhooks/shopify/orders/create`
**Event:** `orders/create`
**Format:** JSON

### 2. Bestellungs-Updates (orders/updated)
**URL:** `https://deine-domain.de/api/webhooks/shopify/orders/updated`
**Event:** `orders/updated`
**Format:** JSON

## Schritt-für-Schritt Anleitung

### 1. Shopify Admin öffnen
1. Gehe zu deinem Shopify Admin: `https://admin.shopify.com/store/[dein-shop]`
2. Navigiere zu: **Einstellungen** → **Benachrichtigungen** → **Webhooks**

### 2. Webhook für neue Bestellungen erstellen
1. Klicke auf **Webhook erstellen**
2. Wähle **Event:** `Order creation` (orders/create)
3. **Format:** JSON
4. **URL:** `https://deine-domain.de/api/webhooks/shopify/orders/create`
5. **API-Version:** Neueste Version (z.B. 2024-01)
6. Klicke auf **Speichern**

### 3. Webhook für Bestellungs-Updates erstellen
1. Klicke auf **Webhook erstellen**
2. Wähle **Event:** `Order updated` (orders/updated)
3. **Format:** JSON
4. **URL:** `https://deine-domain.de/api/webhooks/shopify/orders/updated`
5. **API-Version:** Neueste Version
6. Klicke auf **Speichern**

## Umgebungsvariablen

Stelle sicher, dass folgende Variablen in deiner `.env` Datei gesetzt sind:

```env
# Shopify API Credentials
SHOPIFY_API_SECRET=dein_shopify_api_secret
SHOPIFY_SHOP_DOMAIN=dein-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=dein_access_token

# Email Configuration (für automatischen Versand)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine@email.de
SMTP_PASS=dein_passwort
SMTP_SECURE=false

# Oder Resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=rechnung@deine-domain.de

# App URL
NEXT_PUBLIC_APP_URL=https://deine-domain.de
```

## Funktionsweise

### Bei neuer Bestellung (orders/create):
1. ✅ Webhook wird von Shopify ausgelöst
2. ✅ System erstellt automatisch eine Rechnung in der Datenbank
3. ✅ Rechnung erscheint sofort in "Alle Rechnungen"
4. ✅ **Automatischer E-Mail-Versand:**
   - **Shopify Payments / PayPal:** Rechnung wird sofort gesendet (Status: PAID)
   - **Vorkasse / Rechnung:** Rechnung wird sofort gesendet (Status: SENT)
5. ✅ **Digitale Produkte:** Produktschlüssel werden automatisch versendet (bei bezahlten Bestellungen)

### Bei Bestellungs-Update (orders/updated):
1. ✅ Status-Änderungen werden erkannt (z.B. pending → paid)
2. ✅ Bei Übergang zu "bezahlt": Rechnung und digitale Schlüssel werden versendet

## Zahlungsmethoden-Mapping

Das System erkennt automatisch die Zahlungsmethode:

| Shopify Gateway | System-Zahlungsmethode |
|-----------------|------------------------|
| shopify_payments | Shopify Payments |
| paypal | PayPal |
| manual | Vorkasse |
| bank_transfer | Vorkasse |
| invoice | Rechnung |

## Testen

### 1. Test-Bestellung erstellen
1. Erstelle eine Test-Bestellung in Shopify
2. Überprüfe die Logs in deiner Konsole
3. Prüfe, ob die Rechnung in "Alle Rechnungen" erscheint
4. Prüfe, ob die E-Mail versendet wurde

### 2. Webhook-Logs überprüfen
In Shopify Admin:
1. **Einstellungen** → **Benachrichtigungen** → **Webhooks**
2. Klicke auf den Webhook
3. Scrolle zu "Recent deliveries"
4. Überprüfe Status-Codes:
   - ✅ **200**: Erfolgreich
   - ❌ **401**: Authentifizierung fehlgeschlagen
   - ❌ **500**: Server-Fehler

## Troubleshooting

### Webhooks werden nicht empfangen
- ✅ Überprüfe, ob die URL korrekt ist
- ✅ Stelle sicher, dass `SHOPIFY_API_SECRET` gesetzt ist
- ✅ Prüfe die Shopify Webhook-Logs auf Fehler

### E-Mails werden nicht versendet
- ✅ Überprüfe SMTP/Resend Konfiguration
- ✅ Prüfe die Server-Logs
- ✅ Stelle sicher, dass Kunden-E-Mail vorhanden ist

### Digitale Schlüssel werden nicht versendet
- ✅ Überprüfe, ob Produkt als "digital" markiert ist
- ✅ Stelle sicher, dass Schlüssel im System vorhanden sind
- ✅ Prüfe, ob Bestellung als "bezahlt" markiert ist

## Sicherheit

- ✅ Alle Webhooks werden mit HMAC-Signatur verifiziert
- ✅ Nur authentifizierte Shopify-Anfragen werden akzeptiert
- ✅ Doppelte Verarbeitung wird verhindert

## Support

Bei Problemen:
1. Überprüfe die Server-Logs
2. Teste mit Shopify's "Send test notification"
3. Prüfe die Webhook-Delivery-Logs in Shopify
