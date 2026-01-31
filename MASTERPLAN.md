## Phase 1: Setup & Infrastruktur
1.  **Repository forken:** Forke das `jesterui/jesterui` Repo in deinen Account.
2.  **Lokale Entwicklung:** Klone es lokal und installiere die Abhängigkeiten mit `npm install`.
3.  **GitHub Pages Vorbereitung:**
    *   Suche in der `package.json` nach dem Feld `"homepage"`. Setze es auf `"https://<dein-nutzername>.github.io/<repo-name>/"`.
    *   Ändere den Router im Code von `BrowserRouter` auf `HashRouter` (in der `App.js` oder `index.js`), damit die Navigation auf GitHub Pages ohne Server-Konfiguration funktioniert.
4.  **Deployment-Routine:** Erstelle die GitHub Action `.github/workflows/deploy.yml` (wie zuvor beschrieben), damit jeder Push automatisch online geht.

## Phase 2: Protokoll- & Performance-Update
Ziel: Die App schneller und "Nostr-nativer" machen.

1.  **NIP-33 Migration (Zustandsspeicherung):**
    *   Implementiere `kind: 30005` (oder ein ähnliches Parameterized Replaceable Event) für den Spielzustand.
    *   Anstatt die gesamte Historie aller Züge von den Relays zu laden, fragst du nur das neueste Event mit dem `d`-Tag (deine Game-ID) ab.
    *   Speichere im `content` dieses Events immer den aktuellen **FEN-String** des Bretts.
2.  **Multisync-Relays:**
    *   Überarbeite die Relay-Anbindung. Nutze eine Liste von 3-5 Standard-Relays (z.B. `wss://relay.damus.io`, `wss://nos.lol`), um Redundanz zu gewährleisten.
3.  **Caching:**
    *   Implementiere eine lokale Speicherung (`localStorage`), die den letzten bekannten Zustand eines Spiels sofort anzeigt, während die App im Hintergrund das Relay nach Updates fragt.

## Phase 3: UX & Modernisierung der UI
1.  **Engine-Upgrade:**
    *   Ersetze veraltete Schach-Bibliotheken durch `chess.js` (Logik) und `react-chessboard` (Visualisierung) für flüssigere Animationen und Drag-and-Drop.
2.  **Nostr-Identity:**
    *   Integriere eine Profil-Vorschau. Wenn ein Gegner gefunden wird, lade sein `kind: 0` Event (Name, Avatar, NIP-05), damit man sieht, gegen wen man spielt.
3.  **Optimistisches UI:**
    *   Sorge dafür, dass der Client den eigenen Zug sofort grafisch ausführt, noch bevor die Signierung und das Senden an das Relay abgeschlossen ist.

## Phase 4: Soziale Features & Interaktion
1.  **Open Lobby:**
    *   Erstelle eine Ansicht für "Offene Herausforderungen". Dies sind `kind: 1` Events mit einem spezifischen Hashtag (z.B. `#NostrChessChallenge`).
2.  **Zaps Integration:**
    *   Füge einen "Zap-Button" für das Profil des Gegners hinzu. Nutze die `lnurl` aus den Metadaten des Gegners, um Belohnungen für gute Partien zu ermöglichen.
3.  **Zuschauer-Link:**
    *   Generiere für jedes Spiel einen Unique Link (basierend auf der Event-ID des Spielstarts), den man teilen kann, damit andere über deine GitHub Pages Instanz live zuschauen können.

## Phase 5: Testing & Go-Live
1.  **Validierungs-Check:** Teste hart, ob illegale Züge (die manuell in die Konsole eingegeben wurden) vom Client korrekt abgelehnt werden.
2.  **Mobile Optimierung:** Da viele Nostr-Nutzer mobil unterwegs sind, stelle sicher, dass das Schachbrett auf dem Smartphone perfekt skaliert (Responsive Design).
3.  **Public Launch:** Veröffentliche den Link zu deiner GitHub Pages Seite auf Nostr mit den Hashtags `#nostr`, `#chess` und `#nostrdev`.

## Zusammenfassung der Architektur
*   **Hosting:** GitHub Pages (Statisch).
*   **Datenbank/Backend:** Nostr Relays (Asynchron).
*   **Logik:** `chess.js` (Client-seitig).
*   **Signierung:** NIP-07 Browser Extensions.

