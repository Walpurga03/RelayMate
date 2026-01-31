/**
 * Optimistic UI Updates
 * 
 * Ermöglicht es, Züge sofort im UI anzuzeigen, bevor sie signiert und an Relays gesendet wurden.
 */

import * as Chess from 'chess.js'
import { ValidFen } from './chess'

export enum OptimisticMoveStatus {
  PENDING = 'pending',     // Zug wird verarbeitet
  SIGNING = 'signing',     // Warte auf Signatur
  SENDING = 'sending',     // Wird an Relays gesendet
  CONFIRMED = 'confirmed', // Von Relay bestätigt
  FAILED = 'failed',       // Fehler aufgetreten
}

export interface OptimisticMove {
  id: string // Temporäre ID
  from: string
  to: string
  promotion?: string
  fen: string // Resultierender FEN
  san: string // Standard Algebraic Notation
  timestamp: number
  status: OptimisticMoveStatus
  error?: string
}

class OptimisticMoveManager {
  private moves: Map<string, OptimisticMove> = new Map()
  private listeners: Set<(moves: OptimisticMove[]) => void> = new Set()

  /**
   * Fügt einen optimistischen Zug hinzu
   */
  addMove(from: string, to: string, promotion?: string, currentFen?: string): OptimisticMove | null {
    try {
      const game = new Chess.Chess(currentFen)
      const move = game.move({ from, to, promotion })
      
      if (!move) {
        console.error('Invalid move:', { from, to, promotion })
        return null
      }

      const optimisticMove: OptimisticMove = {
        id: this.generateId(),
        from,
        to,
        promotion,
        fen: game.fen(),
        san: move.san,
        timestamp: Date.now(),
        status: OptimisticMoveStatus.PENDING,
      }

      this.moves.set(optimisticMove.id, optimisticMove)
      this.notifyListeners()
      
      return optimisticMove
    } catch (error) {
      console.error('Failed to add optimistic move:', error)
      return null
    }
  }

  /**
   * Aktualisiert den Status eines Zugs
   */
  updateMoveStatus(id: string, status: OptimisticMoveStatus, error?: string): void {
    const move = this.moves.get(id)
    if (move) {
      move.status = status
      move.error = error
      this.notifyListeners()

      // Entferne bestätigte oder fehlgeschlagene Züge nach kurzer Zeit
      if (status === OptimisticMoveStatus.CONFIRMED || status === OptimisticMoveStatus.FAILED) {
        setTimeout(() => {
          this.moves.delete(id)
          this.notifyListeners()
        }, status === OptimisticMoveStatus.CONFIRMED ? 2000 : 5000)
      }
    }
  }

  /**
   * Gibt alle ausstehenden Züge zurück
   */
  getPendingMoves(): OptimisticMove[] {
    return Array.from(this.moves.values()).filter(
      move => move.status !== OptimisticMoveStatus.CONFIRMED
    )
  }

  /**
   * Gibt alle Züge zurück
   */
  getAllMoves(): OptimisticMove[] {
    return Array.from(this.moves.values())
  }

  /**
   * Registriert einen Listener für Änderungen
   */
  subscribe(listener: (moves: OptimisticMove[]) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Bereinigt alle Züge
   */
  clear(): void {
    this.moves.clear()
    this.notifyListeners()
  }

  /**
   * Entfernt einen spezifischen Zug
   */
  removeMove(id: string): void {
    this.moves.delete(id)
    this.notifyListeners()
  }

  private generateId(): string {
    return `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private notifyListeners(): void {
    const moves = this.getAllMoves()
    this.listeners.forEach(listener => listener(moves))
  }
}

// Singleton Instance
export const optimisticMoveManager = new OptimisticMoveManager()

/**
 * Helper: Führt einen Zug mit optimistischem Update aus
 */
export async function executeOptimisticMove(
  from: string,
  to: string,
  currentFen: string,
  promotion?: string,
  signAndSendFn?: (move: OptimisticMove) => Promise<void>
): Promise<OptimisticMove | null> {
  // 1. Zug sofort im UI anzeigen
  const optimisticMove = optimisticMoveManager.addMove(from, to, promotion, currentFen)
  
  if (!optimisticMove) {
    return null
  }

  // 2. Signierung und Senden im Hintergrund
  if (signAndSendFn) {
    try {
      optimisticMoveManager.updateMoveStatus(optimisticMove.id, OptimisticMoveStatus.SIGNING)
      await signAndSendFn(optimisticMove)
      optimisticMoveManager.updateMoveStatus(optimisticMove.id, OptimisticMoveStatus.CONFIRMED)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      optimisticMoveManager.updateMoveStatus(
        optimisticMove.id, 
        OptimisticMoveStatus.FAILED, 
        errorMessage
      )
      console.error('Failed to execute move:', error)
    }
  }

  return optimisticMove
}

/**
 * Gibt den aktuellen FEN unter Berücksichtigung optimistischer Züge zurück
 */
export function getOptimisticFen(baseFen: string): string {
  const pendingMoves = optimisticMoveManager.getPendingMoves()
  
  if (pendingMoves.length === 0) {
    return baseFen
  }

  // Nimm den FEN des letzten ausstehenden Zugs
  const lastMove = pendingMoves[pendingMoves.length - 1]
  return lastMove.fen
}
