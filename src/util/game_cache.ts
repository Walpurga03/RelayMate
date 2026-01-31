/**
 * Game State Cache using localStorage
 * Speichert den letzten bekannten Spielzustand für sofortige Anzeige
 */

export interface CachedGameState {
  gameId: string
  fen: string
  lastMove?: string
  timestamp: number
  lastMoveTime?: number
}

const CACHE_PREFIX = 'jester_game_cache_'
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 Tage

export class GameStateCache {
  /**
   * Speichert einen Spielzustand im Cache
   */
  static saveGameState(gameId: string, fen: string, lastMove?: string): void {
    try {
      const cacheKey = CACHE_PREFIX + gameId
      const cacheData: CachedGameState = {
        gameId,
        fen,
        lastMove,
        timestamp: Date.now(),
        lastMoveTime: lastMove ? Date.now() : undefined,
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to save game state to cache:', error)
    }
  }

  /**
   * Lädt einen Spielzustand aus dem Cache
   */
  static loadGameState(gameId: string): CachedGameState | null {
    try {
      const cacheKey = CACHE_PREFIX + gameId
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) {
        return null
      }

      const cacheData: CachedGameState = JSON.parse(cached)
      
      // Prüfe ob Cache abgelaufen ist
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_MS) {
        this.clearGameState(gameId)
        return null
      }

      return cacheData
    } catch (error) {
      console.warn('Failed to load game state from cache:', error)
      return null
    }
  }

  /**
   * Löscht einen Spielzustand aus dem Cache
   */
  static clearGameState(gameId: string): void {
    try {
      const cacheKey = CACHE_PREFIX + gameId
      localStorage.removeItem(cacheKey)
    } catch (error) {
      console.warn('Failed to clear game state from cache:', error)
    }
  }

  /**
   * Löscht alle abgelaufenen Cache-Einträge
   */
  static cleanupExpiredCache(): void {
    try {
      const now = Date.now()
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(CACHE_PREFIX)) {
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheData: CachedGameState = JSON.parse(cached)
            if (now - cacheData.timestamp > CACHE_EXPIRY_MS) {
              keysToRemove.push(key)
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired cache entries`)
      }
    } catch (error) {
      console.warn('Failed to cleanup expired cache:', error)
    }
  }

  /**
   * Gibt alle gecachten Spiel-IDs zurück
   */
  static getAllCachedGameIds(): string[] {
    try {
      const gameIds: string[] = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(CACHE_PREFIX)) {
          const gameId = key.substring(CACHE_PREFIX.length)
          gameIds.push(gameId)
        }
      }

      return gameIds
    } catch (error) {
      console.warn('Failed to get cached game IDs:', error)
      return []
    }
  }
}

// Cleanup beim Laden der App
GameStateCache.cleanupExpiredCache()
