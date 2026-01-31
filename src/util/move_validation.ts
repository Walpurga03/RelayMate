/**
 * Zug-Validierung und Sicherheitsprüfungen
 * 
 * Stellt sicher, dass nur legale Züge ausgeführt werden können
 */

import * as Chess from 'chess.js'
import { ValidFen } from './chess'

export interface ValidationResult {
  valid: boolean
  error?: string
  san?: string // Standard Algebraic Notation des Zugs
}

/**
 * Validiert einen Zug
 */
export function validateMove(
  fen: string,
  from: string,
  to: string,
  promotion?: string
): ValidationResult {
  try {
    const game = new Chess.Chess(fen)
    
    // Versuche den Zug auszuführen
    const move = game.move({ from, to, promotion })
    
    if (!move) {
      return {
        valid: false,
        error: 'Ungültiger Zug: Dieser Zug ist nicht erlaubt',
      }
    }

    return {
      valid: true,
      san: move.san,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Validiert ob ein Spieler am Zug ist
 */
export function validatePlayerTurn(fen: string, playerColor: 'w' | 'b'): ValidationResult {
  try {
    const game = new Chess.Chess(fen)
    const turn = game.turn()
    
    if (turn !== playerColor) {
      return {
        valid: false,
        error: `Nicht am Zug: ${playerColor === 'w' ? 'Schwarz' : 'Weiß'} ist am Zug`,
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'Ungültige Brettposition',
    }
  }
}

/**
 * Validiert einen FEN-String
 */
export function validateFen(fen: string): ValidationResult {
  try {
    const game = new Chess.Chess(fen)
    
    // Wenn Chess.js den FEN akzeptiert, ist er gültig
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'Ungültiger FEN-String',
    }
  }
}

/**
 * Prüft ob das Spiel beendet ist
 */
export function checkGameStatus(fen: string): {
  isGameOver: boolean
  result?: 'checkmate' | 'stalemate' | 'draw' | 'insufficient_material' | 'threefold_repetition'
  winner?: 'white' | 'black' | 'draw'
  inCheck: boolean
} {
  try {
    const game = new Chess.Chess(fen)
    
    const isGameOver = game.isGameOver()
    const inCheck = game.inCheck()
    
    let result: any = undefined
    let winner: any = undefined
    
    if (isGameOver) {
      if (game.isCheckmate()) {
        result = 'checkmate'
        winner = game.turn() === 'w' ? 'black' : 'white' // Der andere Spieler hat gewonnen
      } else if (game.isStalemate()) {
        result = 'stalemate'
        winner = 'draw'
      } else if (game.isDraw()) {
        result = 'draw'
        winner = 'draw'
      } else if (game.isInsufficientMaterial()) {
        result = 'insufficient_material'
        winner = 'draw'
      } else if (game.isThreefoldRepetition()) {
        result = 'threefold_repetition'
        winner = 'draw'
      }
    }
    
    return {
      isGameOver,
      result,
      winner,
      inCheck,
    }
  } catch (error) {
    console.error('Failed to check game status:', error)
    return {
      isGameOver: false,
      inCheck: false,
    }
  }
}

/**
 * Gibt alle legalen Züge für eine bestimmte Position zurück
 */
export function getLegalMoves(fen: string, square?: string): string[] {
  try {
    const game = new Chess.Chess(fen)
    
    if (square) {
      return game.moves({ square, verbose: false })
    }
    
    return game.moves({ verbose: false })
  } catch (error) {
    console.error('Failed to get legal moves:', error)
    return []
  }
}

/**
 * Prüft ob ein Zug eine Umwandlung erfordert
 */
export function requiresPromotion(fen: string, from: string, to: string): boolean {
  try {
    const game = new Chess.Chess(fen)
    const piece = game.get(from)
    
    if (!piece || piece.type !== 'p') {
      return false
    }
    
    const toRank = to[1]
    const fromRank = from[1]
    
    // Weiß: von Rang 7 nach 8
    // Schwarz: von Rang 2 nach 1
    if (piece.color === 'w' && fromRank === '7' && toRank === '8') {
      return true
    }
    if (piece.color === 'b' && fromRank === '2' && toRank === '1') {
      return true
    }
    
    return false
  } catch (error) {
    return false
  }
}

/**
 * Sanitiert Benutzereingaben für Züge
 */
export function sanitizeMoveInput(input: string): { from: string; to: string } | null {
  // Entferne Leerzeichen und konvertiere zu Kleinbuchstaben
  const sanitized = input.trim().toLowerCase()
  
  // Format: "e2e4" oder "e2-e4" oder "e2 e4"
  const match = sanitized.match(/^([a-h][1-8])[\s\-]?([a-h][1-8])$/)
  
  if (!match) {
    return null
  }
  
  return {
    from: match[1],
    to: match[2],
  }
}

/**
 * Prüft Anti-Cheat: Validiert die gesamte Spielhistorie
 */
export function validateGameHistory(moves: string[], startFen?: string): ValidationResult {
  try {
    const game = new Chess.Chess(startFen)
    
    for (let i = 0; i < moves.length; i++) {
      const move = game.move(moves[i])
      
      if (!move) {
        return {
          valid: false,
          error: `Ungültiger Zug bei Position ${i + 1}: ${moves[i]}`,
        }
      }
    }
    
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: 'Spielhistorie ist inkonsistent',
    }
  }
}
