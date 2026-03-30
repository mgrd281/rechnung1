# Shopify Device Tracking Setup

Um sicherzustellen, dass die Geräteerkennung (Mobile vs. Desktop) mit 100%iger Genauigkeit funktioniert, muss ein kleines Tracking-Skript in dein Shopify-Theme eingebunden werden.

## Integration via Theme (Empfohlen)

1. Gehe in deinem Shopify-Admin zu **Onlineshop** > **Themes**.
2. Klicke bei deinem aktuellen Theme auf die drei Punkte (...) und wähle **Code bearbeiten**.
3. Suche die Datei `theme.liquid`.
4. Füge den folgenden Code-Block kurz vor dem schließenden `</body>` Tag ein:

```html
<!-- Abandoned Cart Device Tracking -->
<script src="https://{{APP_URL}}/cart-fingerprint.js"></script>
```

> [!IMPORTANT]
> Ersetze `{{APP_URL}}` durch die Domain deiner Anwendung (z.B. `rechnung.vercel.app`). Das Skript erkennt automatisch die Umgebung und sendet die Daten sicher an dein Dashboard.

## Wie es funktioniert
Das Skript prüft auf der Checkout-Seite, ob es sich um ein Touch-Gerät handelt (was wesentlich zuverlässiger ist als die reine User-Agent-Analyse). Sobald ein Gerät verifiziert wurde, erscheint im Dashboard ein **grüner Haken** neben der Geräteinfo.

## Fehlerbehebung
Wenn weiterhin "Unbekannt" angezeigt wird:
1. Prüfe, ob das Skript korrekt geladen wird (Browser-Konsole > Network).
2. Stelle sicher, dass die Checkout-ID in der URL vorhanden ist.
3. Kontrolliere das Dashboard Tooltip: Wenn "Raw UA: Leer" dort steht, konnte Shopify serverseitig keine Daten liefern und das Skript hat ebenfalls nicht gefeuert.
