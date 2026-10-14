# Borizzz Online – synchronisiertes Spiel

Dieses Update ergänzt echte synchronisierte Grundzüge über eine serverseitige Vercel-API. Verdeckte Hände liegen in `room_private` und werden nie an andere Spieler ausgegeben. Der Browser erhält nur die eigene Hand und öffentliche Kartenanzahlen.

## A. Supabase vorbereiten
1. Supabase → SQL Editor → New query.
2. Inhalt von `supabase/migration.sql` einfügen und Run drücken.
3. Supabase → Project Settings → API Keys → Secret keys: den `service_role`/Secret Key kopieren. Nicht in den Browser oder Chat einfügen.

## B. Dateien ersetzen in GitHub
ZIP entpacken. Im Repository die folgenden Dateien/Ordner am Repository-Root hochladen und ersetzen:
- `package.json`
- `app/layout.js`
- `app/page.js`
- `app/api/game/route.js` (Ordner `app/api/game` neu anlegen)
- `app/styles.css`

## C. Vercel Environment Variables
Vercel → Project → Environment Variables. Füge hinzu:
- `SUPABASE_URL` = Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = Supabase Secret/service_role key
Beide auf **Secret** stellen und nur **Production** auswählen (Preview optional). Dieser Schlüssel muss serverseitig bleiben; kein `NEXT_PUBLIC_`-Prefix.

## D. Neu deployen und testen
Nach GitHub-Commit wird Vercel automatisch deployen. Dann in zwei Browsern beitreten, Host startet Partie. Unterstützt sind Lobby, Deal, Startkarten, Ziehen, Tauschen/Ablegen, 10s-Reaktion, Ablage nehmen, gleiche eigene/fremde Karte, Strafkarte, Bube/Dame/König, BORIZZZ und Übergabe. Die Echtzeit-Synchronisierung läuft über kurze Server-Polls.

Hinweis: Dies ist ein privater Prototyp. Vor breiter öffentlicher Nutzung sollten zusätzlich Rate-Limits und Accounts ergänzt werden.
