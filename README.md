
# 📄 Deutsches Rechnungsverwaltungssystem

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https%3A%2F%2Fgithub.com%2Fmgrd281%2Finvoice&plugins=postgresql)

Ein umfassendes System zur Verwaltung und Erstellung von Rechnungen auf Deutsch mit CSV-Unterstützung und E-Mail-Versand.

## ✨ Funktionen

- 📊 **Shop Analytics (Erweitert)** mit KPIs & Charts
- ⏱️ **Live Besucher Analytics** & Session-Tracking
- 🧾 **Professionelle Rechnungserstellung** mit deutschem Standarddesign
- 📊 **CSV-Import** von Shopify und anderen Systemen
- 📧 **Automatischer E-Mail-Versand** mit PDF-Anhang
- 🏢 **Verwaltung von Unternehmen** und Kunden
- ⭐ **Bewertungsmanagement** mit Google Shopping Integration
- 📦 **Digitale Produkte** & Lizenzschlüssel-Verwaltung
- 🛒 **Warenkorb-Wiederherstellung** (Abandoned Cart Recovery)
- 💰 **Automatisiertes Mahnwesen** & Vorkasse-Erinnerungen
- 🎨 **Moderne Benutzeroberfläche** mit Tailwind CSS
- 🔐 **Sicheres Authentifizierungssystem**
- 📱 **Responsives Design** für alle Geräte

## 🚀 Verwendete Technologien

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Datenbank:** PostgreSQL
- **Authentifizierung:** NextAuth.js
- **PDF-Generierung:** jsPDF
- **E-Mail:** Resend API
- **UI-Komponenten:** Radix UI

## 📦 Installation

1. **Projekt klonen:**
   ```bash
   git clone <repository-url>
   cd rechnung
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

3. **Datenbank einrichten:**
   ```bash
   cp .env.example .env.local
   # Fügen Sie DATABASE_URL in .env.local hinzu
   npx prisma db push
   ```

4. **Anwendung starten:**
   ```bash
   npm run dev
   ```

## 🔧 Umgebungsvariablen (Environment Variables)

Erstellen Sie eine `.env` Datei oder konfigurieren Sie diese Variablen in Vercel:

```env
# Datenbank (optional, falls verwendet)
DATABASE_URL="postgresql://..."

# Authentifizierung
NEXTAUTH_SECRET="ein-langes-sicheres-geheimnis"
NEXTAUTH_URL="http://localhost:3000" (oder Ihre Vercel URL)

# E-Mail (SMTP - Gmail, Outlook, etc.)
EMAIL_DEV_MODE="false"       # "true" für Simulation, "false" für echten Versand
SMTP_HOST="smtp.gmail.com"
SMTP_USER="ihre-email@gmail.com"
SMTP_PASS="ihr-app-passwort" # Nicht das normale Passwort!
EMAIL_FROM="ihre-email@gmail.com"

# Shopify (Wichtig für Vercel!)
SHOPIFY_SHOP_DOMAIN="ihr-shop.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_xxxxxxxxxxxxxxxxxxxx"
```

## 📧 E-Mail-Einrichtung (SMTP)

Das System nutzt Standard-SMTP. Für Gmail:
1. Aktivieren Sie die **2-Faktor-Authentifizierung** in Ihrem Google-Konto.
2. Erstellen Sie ein **App-Passwort** (Suche nach "App-Passwörter" im Google-Konto).
3. Nutzen Sie dieses Passwort als `SMTP_PASS`.

## 🛍️ Shopify Integration

Für eine dauerhafte Verbindung auf Vercel müssen Sie `SHOPIFY_SHOP_DOMAIN` und `SHOPIFY_ACCESS_TOKEN` in den Environment Variables hinterlegen.

## 📊 CSV-Import

Das System unterstützt den Import von CSV-Dateien aus:
- Shopify
- WooCommerce
- Anderen Systemen

**Erforderliches CSV-Format:**
```csv
Name,Email,Lineitem name,Lineitem price,Lineitem quantity,Lineitem sku
John Doe,john@example.com,Produktname,19.99,2,SKU123
```

## 🏗️ Build und Deployment

```bash
# Build für Produktion
npm run build

# Produktion starten
npm start

# Code-Überprüfung
npm run lint
```

## 🌐 Deployment

### Vercel (Empfohlen):
1. Code auf GitHub hochladen
2. Projekt mit Vercel verbinden
3. Umgebungsvariablen hinzufügen
4. Automatisches Deployment!

### Railway:
1. Neues Projekt erstellen
2. GitHub-Repository verbinden
3. PostgreSQL-Datenbank hinzufügen
4. Umgebungsvariablen konfigurieren

## 📁 Projektstruktur

```
├── app/                 # Next.js App Router
├── components/          # React Components
├── lib/                # Utilities & Services
├── prisma/             # Database Schema
├── public/             # Statische Assets
└── user-storage/       # Benutzer-Uploads
```

## 🔐 Sicherheit

- Sichere Authentifizierung mit NextAuth.js
- Passwortverschlüsselung
- Schutz von API-Routen
- Datenvalidierung

## 🐛 Fehlerbehebung

### Häufige Probleme:

1. **Datenbankfehler:**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **Build-Probleme:**
   ```bash
   rm -rf .next
   npm install
   npm run build
   ```

3. **E-Mail-Probleme:**
   - Überprüfen Sie RESEND_API_KEY
   - Stellen Sie sicher, dass EMAIL_DEV_MODE korrekt eingestellt ist

## 📞 Support

- 📧 E-Mail: support@example.com
- 📖 Dokumentation: Siehe Hilfedateien im Ordner
- 🐛 Fehler: Erstellen Sie ein Issue auf GitHub

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

---

**Entwickelt mit ❤️ für deutsches Rechnungsmanagement**
