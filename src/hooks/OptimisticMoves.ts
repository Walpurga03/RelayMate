import { useEffect, useState } from 'react'
import { 
  OptimisticMove, 
  OptimisticMoveStatus,
  optimisticMoveManager 
} from '../util/optimistic_ui'

/**
 * Hook für optimistische Move-Updates
 */
export function useOptimisticMoves() {
  const [moves, setMoves] = useState<OptimisticMove[]>([])

  useEffect(() => {
    // Initiale Züge laden
    setMoves(optimisticMoveManager.getAllMoves())

    // Auf Änderungen subscriben
    const unsubscribe = optimisticMoveManager.subscribe((updatedMoves) => {
      setMoves(updatedMoves)
    })

    return unsubscribe
  }, [])

  const pendingMoves = moves.filter(m => 
    m.status === OptimisticMoveStatus.PENDING || 
    m.status === OptimisticMoveStatus.SIGNING ||
    m.status === OptimisticMoveStatus.SENDING
  )

  const confirmedMoves = moves.filter(m => m.status === OptimisticMoveStatus.CONFIRMED)
  const failedMoves = moves.filter(m => m.status === OptimisticMoveStatus.FAILED)

  return {
    allMoves: moves,
    pendingMoves,
    confirmedMoves,
    failedMoves,
    hasPendingMoves: pendingMoves.length > 0,
    hasFailedMoves: failedMoves.length > 0,
  }
}

/**
 * Hook für optimistischen FEN-String
 */
export function useOptimisticFen(baseFen: string): string {
  const { pendingMoves } = useOptimisticMoves()

  if (pendingMoves.length === 0) {
    return baseFen
  }

  // Nimm den FEN des letzten ausstehenden Zugs
  return pendingMoves[pendingMoves.length - 1].fen
}
