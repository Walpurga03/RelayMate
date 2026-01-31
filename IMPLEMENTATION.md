# JesterUI - Nostr Chess Implementation Guide

## 🚀 Deployment-Anleitung

### Voraussetzungen
- Node.js 18+ installiert
- Git installiert
- GitHub Account

### Schritt 1: Repository Setup
```bash
# Forke das Repository auf GitHub
# Klone es lokal
git clone https://github.com/<dein-username>/jesterui.git
cd jesterui

# Installiere Dependencies
npm install
```

### Schritt 2: GitHub Pages konfigurieren
Die `homepage` in der [package.json](package.json) ist bereits gesetzt auf:
```json
"homepage": "https://tower.github.io/jesterui/"
```

**WICHTIG:** Ändere dies zu deinem eigenen GitHub-Username:
```json
"homepage": "https://<dein-username>.github.io/jesterui/"
```

### Schritt 3: GitHub Actions aktivieren
1. Gehe zu deinem GitHub Repository
2. Settings → Pages
3. Source: "GitHub Actions" auswählen
4. Die Workflow-Datei `.github/workflows/deploy.yml` ist bereits vorhanden

### Schritt 4: Deployment
```bash
# Commite deine Änderungen
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

Die GitHub Action wird automatisch ausgeführt und deine App auf GitHub Pages deployen!

Deine App ist dann erreichbar unter:
`https://<dein-username>.github.io/jesterui/`

---

## 📋 Implementierte Features

### ✅ Phase 1: Setup & Infrastruktur
- [x] HashRouter für GitHub Pages
- [x] GitHub Actions Deployment
- [x] Homepage konfiguriert

### ✅ Phase 2: Protokoll & Performance
- [x] **NIP-33 Migration** - `kind: 30005` für Spielzustand
  - Datei: [src/util/nip33_game_state.ts](src/util/nip33_game_state.ts)
  - Nur neuestes Event wird abgefragt statt gesamte Historie
  
- [x] **Multisync-Relays** - 5 Standard-Relays konfiguriert
  - Datei: [src/util/app_nostr.ts](src/util/app_nostr.ts)
  - Relays: relay.damus.io, nos.lol, relay.nostr.band, nostr.wine, relay.snort.social
  
- [x] **Caching** - localStorage für Spielzustände
  - Datei: [src/util/game_cache.ts](src/util/game_cache.ts)
  - Sofortige Anzeige des letzten bekannten Zustands

### ✅ Phase 3: UX & Modernisierung
- [x] **Engine-Upgrade** - chess.js + @react-chess/chessground bereits installiert ✓
  
- [x] **Nostr-Identity** - Profil-Integration
  - Datei: [src/util/nostr_profiles.ts](src/util/nostr_profiles.ts)
  - Komponente: [src/components/PlayerProfile.tsx](src/components/PlayerProfile.tsx)
  - Lädt kind:0 Events (Name, Avatar, NIP-05)
  - NIP-05 Verifikation
  
- [x] **Optimistisches UI**
  - Datei: [src/util/optimistic_ui.ts](src/util/optimistic_ui.ts)
  - Hook: [src/hooks/OptimisticMoves.ts](src/hooks/OptimisticMoves.ts)
  - Züge werden sofort angezeigt, bevor sie signiert/gesendet werden

### ✅ Phase 4: Soziale Features
- [x] **Open Lobby**
  - Komponente: [src/components/OpenLobby.tsx](src/components/OpenLobby.tsx)
  - Komponente: [src/components/CreateChallenge.tsx](src/components/CreateChallenge.tsx)
  - Zeigt offene Herausforderungen mit Hashtag `#NostrChessChallenge`
  
- [x] **Zaps Integration** - Lightning Zahlungen
  - Datei: [src/util/zaps.ts](src/util/zaps.ts)
  - Komponente: [src/components/ZapButton.tsx](src/components/ZapButton.tsx)
  - WebLN Support
  - LNURL Unterstützung

### ✅ Phase 5: Testing & Mobile
- [x] **Zug-Validierung**
  - Datei: [src/util/move_validation.ts](src/util/move_validation.ts)
  - Verhindert illegale Züge
  - Spielhistorie-Validierung (Anti-Cheat)
  
- [x] **Mobile Optimierung**
  - Responsive Design in [src/index.css](src/index.css)
  - Touch-freundliche Button-Größen (min 44px)
  - Viewport-Optimierung für Mobile
  - Safe Area Support für Notch-Geräte
  - Landscape-Modus Support

---

## 🔧 Entwicklung

### Lokaler Development Server
```bash
npm start
```
Öffnet [http://localhost:3000](http://localhost:3000)

### Build für Production
```bash
npm run build
```

### Tests ausführen
```bash
npm test
```

---

## 🎯 Nächste Schritte

### Integration in bestehende Komponenten
Die neuen Module müssen noch in die bestehenden Komponenten integriert werden:

1. **GameStateCache in GameById integrieren**
   ```typescript
   import { GameStateCache } from '../util/game_cache'
   
   // Beim Laden eines Spiels
   const cached = GameStateCache.loadGameState(gameId)
   if (cached) {
     // Zeige gecachten Zustand sofort an
   }
   
   // Bei jedem Zug
   GameStateCache.saveGameState(gameId, newFen, lastMove)
   ```

2. **PlayerProfile in Spielansicht einbinden**
   ```typescript
   import PlayerProfile from './PlayerProfile'
   
   <PlayerProfile 
     pubkey={opponentPubkey} 
     showAvatar={true}
     showName={true}
     showNip05={true}
   />
   ```

3. **ZapButton zu Spieler hinzufügen**
   ```typescript
   import ZapButton from './ZapButton'
   
   <ZapButton 
     profile={opponentProfile}
     pubkey={opponentPubkey}
     onZapSent={(amount) => console.log('Zapped:', amount)}
   />
   ```

4. **Optimistic UI in Zuglogik einbinden**
   ```typescript
   import { executeOptimisticMove } from '../util/optimistic_ui'
   import { useOptimisticFen } from '../hooks/OptimisticMoves'
   
   const displayFen = useOptimisticFen(actualFen)
   
   const handleMove = async (from, to) => {
     await executeOptimisticMove(from, to, currentFen, undefined, async (move) => {
       // Signiere und sende Event
       await signAndPublishMove(move)
     })
   }
   ```

5. **OpenLobby zur Navigation hinzufügen**
   In [src/routes.ts](src/routes.ts):
   ```typescript
   lobby: '/lobby'
   ```
   
   In [src/App.tsx](src/App.tsx):
   ```typescript
   import OpenLobby from './components/OpenLobby'
   
   <Route path={ROUTES.lobby} element={<OpenLobby />} />
   ```

### Testing-Checkliste
- [ ] Teste illegale Züge werden abgelehnt
- [ ] Teste auf verschiedenen Mobile-Geräten
- [ ] Teste Landscape-Modus
- [ ] Teste Offline-Verhalten (Service Worker)
- [ ] Teste NIP-05 Verifikation
- [ ] Teste Lightning Zaps
- [ ] Teste Open Lobby

---

## 📱 PWA Support (Optional)

Füge zu [public/manifest.json](public/manifest.json) hinzu:
```json
{
  "short_name": "Jester Chess",
  "name": "Jester - Nostr Chess",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "orientation": "any"
}
```

---

## 📚 Dokumentation

### NIP-33 Parameterized Replaceable Events
- Verwendet `kind: 30005` für Spielzustände
- `d`-Tag enthält die Game-ID
- Event wird bei jedem Zug ersetzt
- Nur neuestes Event muss vom Relay geladen werden

### Caching-Strategie
- localStorage für sofortige Anzeige
- Hintergrund-Sync mit Relays
- 7 Tage Cache-Expiry
- Automatische Cleanup-Routine

### Mobile Best Practices
- Touch-Targets mindestens 44x44px
- Keine Auto-Zoom bei Input-Focus (font-size: 16px)
- Safe Area Insets für Notch-Geräte
- Touch-action: manipulation (verhindert Doppel-Tap Zoom)

---

## 🐛 Bekannte Einschränkungen

1. **NIP-33 Integration**: Die NIP-33 Module sind erstellt, müssen aber noch in die bestehende Event-Logik integriert werden
2. **Relay-Kompatibilität**: Nicht alle Relays unterstützen NIP-33
3. **WebLN**: Benötigt Browser-Extension (Alby, etc.)

---

## 📞 Support

Bei Fragen öffne ein Issue auf GitHub oder frage auf Nostr mit dem Hashtag `#jester` oder `#nostrdev`.

---

## 📄 Lizenz

Siehe [LICENSE](LICENSE) Datei.
