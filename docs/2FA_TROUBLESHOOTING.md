# Zwei-Faktor-Authentifizierung - Fehlerbehebung

## 🚨 Häufige Probleme und Lösungen

### Problem: "Fehler beim Aktivieren der 2FA" - 401 Unauthorized

**Ursache:** Das Authentifizierungssystem erkennt den Benutzer nicht.

**Lösungen:**

#### 1. Überprüfen Sie die Anmeldung
```bash
# Überprüfen Sie, ob Sie angemeldet sind
# Gehen Sie zu /auth/signin und melden Sie sich an
```

#### 2. Test-Version verwenden
```bash
# Verwenden Sie die Test-Version ohne Anmeldung
# Gehen Sie zu /test-2fa
```

#### 3. Browser-Cache leeren
```bash
# Löschen Sie Cookies und Cache
# Oder verwenden Sie einen Inkognito-Tab
```

### Problem: QR-Code wird nicht angezeigt

**Ursache:** QRCode-Bibliothek nicht korrekt geladen.

**Lösung:**
```bash
npm install qrcode
npm install @types/qrcode --save-dev
```

### Problem: "Cannot find module 'otplib'"

**Lösung:**
```bash
npm install otplib
npm install @types/otplib --save-dev
```

### Problem: NextAuth Session nicht gefunden

**Ursache:** SessionProvider nicht korrekt konfiguriert.

**Lösung:**
1. Überprüfen Sie `app/layout.tsx`:
```tsx
import { AuthProvider } from '@/components/providers/auth-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

2. Überprüfen Sie `.env.local`:
```env
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Problem: 2FA Code wird nicht akzeptiert

**Mögliche Ursachen:**
1. **Zeitabweichung:** Stellen Sie sicher, dass die Systemzeit korrekt ist
2. **Falscher Code:** Verwenden Sie den aktuellsten Code aus der App
3. **Abgelaufener Code:** TOTP-Codes sind nur 30 Sekunden gültig

**Lösungen:**
1. Synchronisieren Sie die Systemzeit
2. Warten Sie auf einen neuen Code
3. Verwenden Sie einen Backup-Code

### Problem: Backup-Codes funktionieren nicht

**Überprüfung:**
1. Codes sind case-sensitive (Groß-/Kleinschreibung beachten)
2. Jeder Code kann nur einmal verwendet werden
3. Codes müssen exakt eingegeben werden (keine Leerzeichen)

## 🔧 Debugging-Schritte

### 1. Konsole überprüfen
```javascript
// Browser-Konsole öffnen (F12)
// Suchen Sie nach Fehlermeldungen
console.log('2FA Debug Info')
```

### 2. Netzwerk-Tab überprüfen
```
1. Öffnen Sie Developer Tools (F12)
2. Gehen Sie zum Network-Tab
3. Versuchen Sie 2FA zu aktivieren
4. Überprüfen Sie HTTP-Status-Codes:
   - 200: OK
   - 401: Unauthorized (Anmeldung erforderlich)
   - 500: Server Error
```

### 3. Server-Logs überprüfen
```bash
# Terminal mit npm run dev
# Suchen Sie nach Fehlermeldungen wie:
# "Error enabling 2FA"
# "Auth error"
# "Cannot find module"
```

## 🧪 Test-Umgebung

### Test-Seite verwenden
```
URL: /test-2fa
- Funktioniert ohne Anmeldung
- Akzeptiert jeden 6-stelligen Code
- Generiert echte QR-Codes
- Zeigt alle Schritte des Prozesses
```

### Test-Daten
```
Test-Email: test@example.com
Test-Code: Jeder 6-stellige Code (z.B. 123456)
Test-Secret: Wird automatisch generiert
```

## 🔒 Sicherheitshinweise

### Produktionsumgebung
1. **Echte Authentifizierung:** Verwenden Sie niemals Test-Endpoints in Produktion
2. **HTTPS:** Immer HTTPS für 2FA verwenden
3. **Sichere Secrets:** Verwenden Sie starke, zufällige Secrets
4. **Backup-Codes:** Sicher aufbewahren und regelmäßig erneuern

### Entwicklungsumgebung
1. **Test-Daten:** Verwenden Sie nur Test-Daten
2. **Lokale Entwicklung:** OK für HTTP auf localhost
3. **Debug-Logs:** Entfernen Sie Debug-Ausgaben vor Produktion

## 📱 Mobile App Testing

### Google Authenticator
1. Installieren Sie die App
2. Scannen Sie den QR-Code
3. Verwenden Sie den generierten 6-stelligen Code

### Alternative Apps
- Microsoft Authenticator
- Authy
- 1Password
- Bitwarden

## 🆘 Notfall-Wiederherstellung

### Wenn 2FA nicht funktioniert
1. **Backup-Codes verwenden**
2. **Test-Version verwenden** (/test-2fa)
3. **Browser-Cache leeren**
4. **Inkognito-Modus testen**

### Wenn alles fehlschlägt
1. **Entwicklungsserver neu starten**:
   ```bash
   # Strg+C zum Stoppen
   npm run dev
   ```

2. **Dependencies neu installieren**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **TypeScript-Cache leeren**:
   ```bash
   rm -rf .next
   npm run dev
   ```

## 📞 Support-Informationen

### Logs sammeln
```bash
# Browser-Konsole
# Netzwerk-Tab
# Server-Terminal-Ausgabe
```

### Systeminformationen
```bash
node --version
npm --version
# Browser-Version
# Betriebssystem
```

### Fehlermeldungen
```
- Vollständige Fehlermeldung
- Schritte zur Reproduktion
- Erwartetes vs. tatsächliches Verhalten
```

## ✅ Erfolgreiche Installation überprüfen

### Checkliste
- [ ] `/test-2fa` lädt ohne Fehler
- [ ] QR-Code wird angezeigt
- [ ] 6-stelliger Code wird akzeptiert
- [ ] Backup-Codes werden generiert
- [ ] Download funktioniert

### Test-Durchlauf
1. Gehen Sie zu `/test-2fa`
2. Klicken Sie "Zwei-Faktor-Authentifizierung einrichten"
3. QR-Code sollte erscheinen
4. Geben Sie "123456" ein
5. Backup-Codes sollten angezeigt werden
6. Download sollte funktionieren

**Wenn alle Schritte funktionieren, ist die 2FA-Installation erfolgreich!**
