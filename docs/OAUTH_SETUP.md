# OAuth Setup Guide

Diese Anleitung erklärt, wie Sie Google und Apple OAuth für Ihr Rechnungssystem einrichten.

## 🔧 Voraussetzungen

1. **Google Cloud Console Account**
2. **Apple Developer Account** (für Apple Sign-In)
3. **Domäne mit HTTPS** (für Produktion)

## 🌐 Google OAuth Einrichtung

### Schritt 1: Google Cloud Projekt erstellen

1. Gehen Sie zur [Google Cloud Console](https://console.cloud.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes aus
3. Aktivieren Sie die **Google+ API** und **Google Identity API**

### Schritt 2: OAuth 2.0 Credentials erstellen

1. Navigieren Sie zu **APIs & Services > Credentials**
2. Klicken Sie auf **Create Credentials > OAuth 2.0 Client IDs**
3. Wählen Sie **Web application** als Application type
4. Fügen Sie Ihre URLs hinzu:
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (für Entwicklung)
     - `https://yourdomain.com` (für Produktion)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (für Entwicklung)
     - `https://yourdomain.com/api/auth/callback/google` (für Produktion)

### Schritt 3: Credentials konfigurieren

Fügen Sie die erhaltenen Werte zu Ihrer `.env.local` Datei hinzu:

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🍎 Apple Sign-In Einrichtung

### Schritt 1: Apple Developer Account

1. Melden Sie sich bei [Apple Developer](https://developer.apple.com/) an
2. Gehen Sie zu **Certificates, Identifiers & Profiles**

### Schritt 2: App ID erstellen

1. Klicken Sie auf **Identifiers**
2. Erstellen Sie eine neue **App ID**
3. Aktivieren Sie **Sign In with Apple**

### Schritt 3: Service ID erstellen

1. Erstellen Sie eine neue **Services ID**
2. Aktivieren Sie **Sign In with Apple**
3. Konfigurieren Sie die Domains:
   - **Primary App ID**: Ihre erstellte App ID
   - **Domains**: `yourdomain.com`
   - **Return URLs**: `https://yourdomain.com/api/auth/callback/apple`

### Schritt 4: Private Key erstellen

1. Gehen Sie zu **Keys**
2. Erstellen Sie einen neuen Key
3. Aktivieren Sie **Sign In with Apple**
4. Laden Sie die `.p8` Datei herunter

### Schritt 5: JWT Token generieren

Apple benötigt ein JWT Token als Client Secret. Verwenden Sie dieses Node.js Script:

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('path/to/your/AuthKey_XXXXXXXXXX.p8', 'utf8');

const token = jwt.sign({
  iss: 'YOUR_TEAM_ID',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 months
  aud: 'https://appleid.apple.com',
  sub: 'your.service.id'
}, privateKey, {
  algorithm: 'ES256',
  keyid: 'YOUR_KEY_ID'
});

console.log(token);
```

### Schritt 6: Environment Variables setzen

```env
APPLE_ID="your.service.id"
APPLE_SECRET="generated-jwt-token-from-step-5"
```

## 🔐 NextAuth Konfiguration

Stellen Sie sicher, dass Ihre NextAuth Konfiguration korrekt ist:

```env
NEXTAUTH_SECRET="your-very-long-random-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"  # Entwicklung
# NEXTAUTH_URL="https://yourdomain.com"  # Produktion
```

## 🧪 Testen der Konfiguration

### Entwicklung

1. Starten Sie den Entwicklungsserver:
   ```bash
   npm run dev
   ```

2. Navigieren Sie zu `http://localhost:3000/auth/signin`

3. Testen Sie beide OAuth-Provider

### Produktion

1. Stellen Sie sicher, dass alle URLs auf HTTPS umgestellt sind
2. Aktualisieren Sie die Redirect URIs in beiden Konsolen
3. Setzen Sie `NEXTAUTH_URL` auf Ihre Produktions-Domain

## 🚨 Häufige Probleme

### Google OAuth Fehler

- **Error 400: redirect_uri_mismatch**
  - Überprüfen Sie die Redirect URIs in der Google Console
  - Stellen Sie sicher, dass die URLs exakt übereinstimmen

- **Error 403: access_denied**
  - Überprüfen Sie die JavaScript Origins
  - Stellen Sie sicher, dass die APIs aktiviert sind

### Apple Sign-In Fehler

- **Invalid client**
  - Überprüfen Sie die Service ID Konfiguration
  - Stellen Sie sicher, dass die Domain verifiziert ist

- **Invalid JWT**
  - Überprüfen Sie Team ID, Key ID und Service ID
  - Stellen Sie sicher, dass der Private Key korrekt ist

## 📱 Mobile App Unterstützung

Für mobile Apps müssen zusätzliche Konfigurationen vorgenommen werden:

### iOS (Apple)
- Fügen Sie die App Bundle ID zur App ID hinzu
- Konfigurieren Sie die Associated Domains

### Android (Google)
- Fügen Sie den SHA-1 Fingerprint hinzu
- Konfigurieren Sie die Package Name

## 🔒 Sicherheitshinweise

1. **Secrets sicher aufbewahren**: Niemals Client Secrets in öffentlichen Repositories
2. **HTTPS verwenden**: Immer HTTPS in der Produktion
3. **Redirect URIs begrenzen**: Nur notwendige URLs hinzufügen
4. **Regelmäßige Rotation**: Secrets regelmäßig erneuern
5. **Monitoring**: Überwachen Sie OAuth-Logs auf verdächtige Aktivitäten

## 📞 Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehler
2. Überprüfen Sie die Server-Logs
3. Testen Sie mit verschiedenen Browsern
4. Überprüfen Sie die Provider-Dokumentation

## 📚 Weitere Ressourcen

- [NextAuth.js Dokumentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Dokumentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign-In Dokumentation](https://developer.apple.com/sign-in-with-apple/)
