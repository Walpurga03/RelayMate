/**
 * NIP-33 Parameterized Replaceable Events für Spielzustand
 * 
 * Statt die gesamte Historie zu laden, speichern wir den aktuellen Spielzustand
 * in einem Parameterized Replaceable Event (kind: 30005).
 * Das Event wird bei jedem Zug ersetzt und enthält den aktuellen FEN-String.
 */

import * as NIP01 from './nostr/nip01'
import { ValidFen } from './chess'

// Kind 30005 für Schach-Spielzustand (Parameterized Replaceable Event)
export const JESTER_GAME_STATE_KIND: NIP01.Kind = 30005

export interface GameStateContent {
  version: '1' // NIP-33 Version
  fen: string // Aktueller Spielzustand
  pgn: string // PGN Historie
  lastMove?: string // Letzter Zug (z.B. "e2e4")
  moveNumber: number // Zugnummer
  timestamp: number // Zeitstempel des letzten Zugs
  result?: 'white' | 'black' | 'draw' | 'ongoing' // Spielergebnis
}

export interface GameStateEvent extends NIP01.Event {
  kind: typeof JESTER_GAME_STATE_KIND
  // tags wird von NIP01.Event geerbt
}

/**
 * Erstellt ein neues Game State Event (NIP-33)
 */
export function createGameStateEvent(
  gameId: string,
  whitePubkey: string,
  blackPubkey: string,
  content: GameStateContent,
  startTimestamp?: number
): Omit<GameStateEvent, 'id' | 'sig'> {
  return {
    kind: JESTER_GAME_STATE_KIND,
    pubkey: whitePubkey, // Der Ersteller signiert
    created_at: Math.floor(Date.now() / 1000),
    content: JSON.stringify(content),
    tags: [
      ['d', gameId], // NIP-33: d-tag für eindeutige Identifikation
      ['white', whitePubkey],
      ['black', blackPubkey],
      ['started', String(startTimestamp || Math.floor(Date.now() / 1000))],
    ],
  }
}

/**
 * Filter für das neueste Game State Event eines Spiels
 */
export function createGameStateFilter(gameId: string): NIP01.Filter {
  return {
    kinds: [JESTER_GAME_STATE_KIND],
    '#d': [gameId],
    limit: 1, // Nur das neueste Event
  }
}

/**
 * Filter für alle Game State Events eines Spielers
 */
export function createPlayerGamesFilter(pubkey: string): NIP01.Filter {
  return {
    kinds: [JESTER_GAME_STATE_KIND],
    authors: [pubkey],
  }
}

/**
 * Aktualisiert den Spielzustand nach einem Zug
 */
export function updateGameState(
  prevContent: GameStateContent,
  newFen: string,
  newMove: string,
  newPgn: string
): GameStateContent {
  return {
    version: '1',
    fen: newFen,
    pgn: newPgn,
    lastMove: newMove,
    moveNumber: prevContent.moveNumber + 1,
    timestamp: Date.now(),
    result: prevContent.result || 'ongoing',
  }
}

/**
 * Extrahiert den Spielzustand aus einem Event
 */
export function parseGameStateContent(content: string): GameStateContent {
  try {
    const parsed = JSON.parse(content)
    
    // Validierung
    if (!parsed.version || !parsed.fen || !parsed.pgn) {
      throw new Error('Invalid game state content')
    }
    
    return parsed as GameStateContent
  } catch (error) {
    console.error('Failed to parse game state content:', error)
    throw error
  }
}

/**
 * Gibt die Game ID aus einem Game State Event zurück
 */
export function extractGameId(event: GameStateEvent): string | null {
  const dTag = event.tags.find(tag => tag[0] === 'd')
  return dTag ? dTag[1] : null
}

/**
 * Gibt die Spieler Pubkeys aus einem Game State Event zurück
 */
export function extractPlayers(event: GameStateEvent): { white: string; black: string } | null {
  const whiteTag = event.tags.find(tag => tag[0] === 'white')
  const blackTag = event.tags.find(tag => tag[0] === 'black')
  
  if (!whiteTag || !blackTag) {
    return null
  }
  
  return {
    white: whiteTag[1],
    black: blackTag[1],
  }
}

/**
 * Prüft ob ein Event ein gültiges Game State Event ist
 */
export function isGameStateEvent(event: NIP01.Event): event is GameStateEvent {
  if (event.kind !== JESTER_GAME_STATE_KIND) {
    return false
  }
  
  const hasDTag = event.tags.some(tag => tag[0] === 'd')
  const hasWhiteTag = event.tags.some(tag => tag[0] === 'white')
  const hasBlackTag = event.tags.some(tag => tag[0] === 'black')
  
  return hasDTag && hasWhiteTag && hasBlackTag
}
