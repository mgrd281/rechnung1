#!/bin/bash

# Umgebungsvariablen für die Anwendung einrichten
echo "🔧 Umgebung wird eingerichtet..."

# .env.local erstellen, falls nicht vorhanden
if [ ! -f .env.local ]; then
    echo "📝 Erstelle .env.local..."
    cp env-template.txt .env.local
    echo "✅ .env.local wurde erstellt"
else
    echo "⚠️  .env.local existiert bereits"
    echo "Möchten Sie sie überschreiben? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cp env-template.txt .env.local
        echo "✅ .env.local wurde aktualisiert"
    else
        echo "❌ Vorgang abgebrochen"
        exit 0
    fi
fi

# Speicherverzeichnis erstellen
mkdir -p user-storage
echo "✅ Speicherverzeichnis erstellt"

# Abhängigkeiten installieren, falls nötig
if [ ! -d node_modules ]; then
    echo "📦 Installiere Abhängigkeiten..."
    npm install
fi

echo ""
echo "🎉 Umgebung erfolgreich eingerichtet!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Bearbeiten Sie .env.local, um Ihre E-Mail-Einstellungen hinzuzufügen"
echo "2. Starten Sie die Anwendung: npm run dev"
echo "3. Öffnen Sie den Browser unter: http://localhost:3000"
echo ""
echo "💡 Tipps:"
echo "- Lassen Sie EMAIL_DEV_MODE=true für Entwicklung (E-Mail-Simulation)"
echo "- Ändern Sie zu EMAIL_DEV_MODE=false für Produktion mit korrekten SMTP-Einstellungen"
echo "- Verwenden Sie Gmail mit App-Passwort für einfache Einrichtung"
echo ""
