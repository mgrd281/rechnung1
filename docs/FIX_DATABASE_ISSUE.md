# 🚨 DATENBANK-PROBLEM BEHEBEN

## Das Problem

Ihre CockroachDB hat das monatliche Request-Limit erreicht und ist **deaktiviert**:

```
This cluster has reached its Request Unit limit for the month and is now disabled.
```

Dies bedeutet, dass KEINE Datenbankoperationen möglich sind:
- ❌ Keine neuen Rechnungen
- ❌ Keine Bestellungen speichern
- ❌ Keine digitalen Schlüssel zuweisen
- ❌ Keine Emails mit Rechnungen senden

---

## Lösungsoptionen

### Option 1: CockroachDB upgraden (schnell)

1. Gehen Sie zu: https://cockroachlabs.cloud/
2. Melden Sie sich an
3. Gehen Sie zu Ihrem Cluster `healed-shadow-11124`
4. Klicken Sie auf "Upgrade" oder erhöhen Sie die Request Units
5. Bezahlen Sie für mehr Kapazität (~$10-30/Monat)

### Option 2: Zu Supabase wechseln (kostenlos, empfohlen)

1. Gehen Sie zu: https://supabase.com/
2. Erstellen Sie ein kostenloses Konto
3. Erstellen Sie ein neues Projekt
4. Kopieren Sie die **Connection String** (unter Settings > Database)
5. Aktualisieren Sie `.env.local`:
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
   ```
6. Führen Sie aus:
   ```bash
   npx prisma migrate deploy
   # Oder für Entwicklung:
   npx prisma db push
   ```

### Option 3: Zu Neon wechseln (kostenlos)

1. Gehen Sie zu: https://neon.tech/
2. Erstellen Sie ein kostenloses Konto
3. Erstellen Sie eine neue Datenbank
4. Kopieren Sie die Connection String
5. Aktualisieren Sie `.env.local`
6. Führen Sie `npx prisma db push` aus

---

## Nach dem Datenbankwechsel

1. **Server neu starten:**
   ```bash
   npm run dev
   ```

2. **Diagnose ausführen:**
   Gehen Sie zu: http://localhost:3000/admin/webhook-diagnostics

3. **Webhooks testen:**
   Gehen Sie zu Shopify Admin > Einstellungen > Benachrichtigungen > Webhooks
   Und klicken Sie auf "Webhook senden" für einen Testauftrag

---

## Sofortige Überprüfung

Nachdem Sie die Datenbank gewechselt haben, führen Sie aus:

```bash
curl http://localhost:3000/api/diagnostics/webhook-test
```

Alle Checks sollten grün sein!
