# Access Gate (Zugangsschutz) - Documentation

## Übersicht

Das Access Gate ist eine Sicherheitsebene, die **vor** dem regulären Login liegt. Benutzer müssen zuerst ein globales Passwort eingeben, bevor sie überhaupt die Login-Seite oder andere Teile der Anwendung sehen können.

## Funktionsweise

### 1. **Schutz-Ebenen**
```
Benutzer → Access Gate (Passwort) → Login (E-Mail/Passwort) → Dashboard
```

### 2. **Geschützte Routen**
Alle Routen der Anwendung sind geschützt, einschließlich:
- `/dashboard`
- `/invoices`
- `/products`
- `/settings`
- `/shopify`
- `/reviews`
- etc.

### 3. **Cookie-basierte Session**
- Nach erfolgreicher Passwort-Eingabe wird ein Cookie `access_gate_unlocked` gesetzt
- Gültigkeit: **12 Stunden**
- HttpOnly: Ja (nicht über JavaScript zugreifbar)
- Secure: Ja (nur über HTTPS in Production)

## Konfiguration

### Environment Variable
Fügen Sie in Ihrer `.env` Datei hinzu:

```bash
ACCESS_GATE_PASSWORD="IhrSicheresPasswort123!"
```

**Wichtig:**
- Verwenden Sie ein **starkes Passwort**
- Teilen Sie das Passwort **nicht** im Code
- Ändern Sie es regelmäßig

### Standard-Passwort (Development)
Falls `ACCESS_GATE_PASSWORD` nicht gesetzt ist, wird `demo123` verwendet.

## Verwendung

### Für Benutzer

1. **Erste Anmeldung:**
   - Rufen Sie die Anwendung auf (beliebige URL)
   - Sie werden automatisch zu `/access-gate` weitergeleitet
   - Geben Sie das Access Gate Passwort ein
   - Nach erfolgreicher Eingabe: Weiterleitung zur Login-Seite

2. **Wiederholte Anmeldung:**
   - Wenn das Cookie noch gültig ist (< 12 Stunden), wird das Access Gate übersprungen
   - Sie gelangen direkt zur Login-Seite

3. **Logout:**
   - Beim Logout wird auch das Access Gate Cookie gelöscht
   - Beim nächsten Besuch muss das Access Gate Passwort erneut eingegeben werden

### Für Entwickler

#### API Endpoints

**POST /api/auth/gate**
```typescript
// Request
{
  "password": "IhrPasswort"
}

// Response (Success)
{
  "success": true
}

// Response (Error)
{
  "success": false,
  "error": "Falsches Passwort"
}
```

**GET /api/auth/gate**
```typescript
// Response
{
  "unlocked": true | false
}
```

**POST /api/auth/gate-logout**
```typescript
// Response
{
  "success": true
}
```

#### Middleware Logic

Die Middleware (`middleware.ts`) prüft in dieser Reihenfolge:

1. **Static Files & Auth API** → Durchlassen
2. **Access Gate Check:**
   - Ist Cookie `access_gate_unlocked` gesetzt?
   - Nein → Redirect zu `/access-gate`
   - Ja → Weiter zu Schritt 3
3. **NextAuth Check:**
   - Ist Benutzer eingeloggt?
   - Nein → Redirect zu `/auth/signin`
   - Ja → Zugriff gewährt

## Sicherheit

### ✅ Implementierte Sicherheitsmaßnahmen

1. **Server-Side Validation:**
   - Passwort wird nur serverseitig geprüft
   - Kein Passwort im Frontend-Code

2. **HttpOnly Cookie:**
   - Cookie nicht über JavaScript zugreifbar
   - Schutz vor XSS-Angriffen

3. **Secure Cookie (Production):**
   - Cookie nur über HTTPS übertragbar
   - Schutz vor Man-in-the-Middle-Angriffen

4. **SameSite Cookie:**
   - Cookie wird nur an gleiche Domain gesendet
   - Schutz vor CSRF-Angriffen

5. **Zeitbasierte Gültigkeit:**
   - Cookie läuft nach 12 Stunden ab
   - Automatische Abmeldung

### ⚠️ Wichtige Hinweise

- **Kein Ersatz für reguläres Login:** Das Access Gate ist eine zusätzliche Schutzebene, ersetzt aber nicht die Benutzer-Authentifizierung
- **Gemeinsames Passwort:** Alle Benutzer verwenden das gleiche Access Gate Passwort
- **Passwort-Rotation:** Ändern Sie das Passwort regelmäßig
- **HTTPS erforderlich:** In Production sollte die Anwendung nur über HTTPS erreichbar sein

## Deaktivierung

Um das Access Gate zu deaktivieren:

1. **Temporär:** Entfernen Sie `ACCESS_GATE_PASSWORD` aus `.env`
2. **Permanent:** Entfernen Sie den Access Gate Check aus `middleware.ts`

## Troubleshooting

### Problem: "Falsches Passwort" obwohl korrekt

**Lösung:**
- Prüfen Sie, ob `ACCESS_GATE_PASSWORD` in `.env` korrekt gesetzt ist
- Starten Sie den Server neu nach Änderungen an `.env`
- Prüfen Sie auf Leerzeichen am Anfang/Ende des Passworts

### Problem: Endlos-Redirect

**Lösung:**
- Löschen Sie alle Cookies
- Leeren Sie den Browser-Cache
- Prüfen Sie die Middleware-Logik

### Problem: Cookie wird nicht gesetzt

**Lösung:**
- Prüfen Sie, ob HTTPS in Production aktiviert ist
- Prüfen Sie Browser-Einstellungen für Cookies
- Prüfen Sie `sameSite` und `secure` Flags

## Beispiel-Flow

```
1. Benutzer ruft auf: https://app.example.com/dashboard
   ↓
2. Middleware prüft: access_gate_unlocked Cookie?
   ↓ (Nein)
3. Redirect zu: https://app.example.com/access-gate?redirect=/dashboard
   ↓
4. Benutzer gibt Passwort ein
   ↓
5. POST /api/auth/gate
   ↓
6. Cookie gesetzt: access_gate_unlocked=true (12h)
   ↓
7. Redirect zu: https://app.example.com/dashboard
   ↓
8. Middleware prüft: access_gate_unlocked Cookie?
   ↓ (Ja)
9. Middleware prüft: NextAuth Session?
   ↓ (Nein)
10. Redirect zu: https://app.example.com/auth/signin?callbackUrl=/dashboard
    ↓
11. Benutzer loggt sich ein
    ↓
12. Redirect zu: https://app.example.com/dashboard
    ↓
13. ✅ Dashboard wird angezeigt
```

## Support

Bei Fragen oder Problemen:
- Prüfen Sie die Server-Logs
- Prüfen Sie die Browser-Konsole
- Prüfen Sie die Middleware-Logik in `middleware.ts`
