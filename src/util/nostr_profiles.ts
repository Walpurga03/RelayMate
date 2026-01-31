/**
 * Nostr Profile Integration (NIP-01 kind:0 Events)
 * 
 * Lädt und cached Benutzerprofile für eine bessere UX
 */

import * as NIP01 from './nostr/nip01'

// Kind 0 für Metadata (Benutzerprofil)
export const METADATA_KIND: NIP01.Kind = 0

export interface NostrProfile {
  name?: string
  display_name?: string
  about?: string
  picture?: string // Avatar URL
  banner?: string
  nip05?: string // Verifizierte Identität
  lud06?: string // Lightning Address (LNURL)
  lud16?: string // Lightning Address
  website?: string
}

export interface ProfileCache {
  pubkey: string
  profile: NostrProfile
  timestamp: number
  verified?: boolean // NIP-05 Verifikationsstatus
}

const PROFILE_CACHE_KEY = 'jester_profile_cache_'
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 Stunden

/**
 * Erstellt einen Filter für Metadata-Events
 */
export function createMetadataFilter(pubkeys: string[]): NIP01.Filter {
  return {
    kinds: [METADATA_KIND],
    authors: pubkeys,
    limit: pubkeys.length,
  }
}

/**
 * Parsed den Content eines Metadata-Events
 */
export function parseMetadata(content: string): NostrProfile {
  try {
    return JSON.parse(content) as NostrProfile
  } catch (error) {
    console.error('Failed to parse metadata:', error)
    return {}
  }
}

/**
 * Speichert ein Profil im Cache
 */
export function cacheProfile(pubkey: string, profile: NostrProfile): void {
  try {
    const cacheData: ProfileCache = {
      pubkey,
      profile,
      timestamp: Date.now(),
    }
    localStorage.setItem(PROFILE_CACHE_KEY + pubkey, JSON.stringify(cacheData))
  } catch (error) {
    console.warn('Failed to cache profile:', error)
  }
}

/**
 * Lädt ein Profil aus dem Cache
 */
export function getCachedProfile(pubkey: string): ProfileCache | null {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY + pubkey)
    if (!cached) {
      return null
    }

    const cacheData: ProfileCache = JSON.parse(cached)
    
    // Prüfe ob Cache abgelaufen ist
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(PROFILE_CACHE_KEY + pubkey)
      return null
    }

    return cacheData
  } catch (error) {
    console.warn('Failed to load cached profile:', error)
    return null
  }
}

/**
 * Formatiert einen Displaynamen aus einem Profil
 */
export function formatDisplayName(profile: NostrProfile, pubkey?: string): string {
  if (profile.display_name) {
    return profile.display_name
  }
  if (profile.name) {
    return profile.name
  }
  if (profile.nip05) {
    return profile.nip05
  }
  if (pubkey) {
    return formatPubkey(pubkey)
  }
  return 'Anonymous'
}

/**
 * Formatiert einen Pubkey für die Anzeige (gekürzt)
 */
export function formatPubkey(pubkey: string): string {
  if (pubkey.length < 16) {
    return pubkey
  }
  return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`
}

/**
 * Verifiziert eine NIP-05 Identität
 */
export async function verifyNip05(nip05: string, pubkey: string): Promise<boolean> {
  try {
    const [name, domain] = nip05.split('@')
    if (!name || !domain) {
      return false
    }

    const url = `https://${domain}/.well-known/nostr.json?name=${name}`
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return false
    }

    const json = await response.json()
    const foundPubkey = json.names?.[name]

    return foundPubkey === pubkey
  } catch (error) {
    console.warn('NIP-05 verification failed:', error)
    return false
  }
}

/**
 * Extrahiert die Lightning-Adresse aus einem Profil
 */
export function getLightningAddress(profile: NostrProfile): string | null {
  return profile.lud16 || profile.lud06 || null
}

/**
 * Prüft ob ein Profil vollständig ist
 */
export function isCompleteProfile(profile: NostrProfile): boolean {
  return !!(profile.name || profile.display_name) && !!profile.picture
}

/**
 * Bereinigt den Profil-Cache
 */
export function cleanupProfileCache(): void {
  try {
    const now = Date.now()
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PROFILE_CACHE_KEY)) {
        const cached = localStorage.getItem(key)
        if (cached) {
          const cacheData: ProfileCache = JSON.parse(cached)
          if (now - cacheData.timestamp > CACHE_EXPIRY_MS) {
            keysToRemove.push(key)
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} expired profile cache entries`)
    }
  } catch (error) {
    console.warn('Failed to cleanup profile cache:', error)
  }
}

// Cleanup beim Laden
cleanupProfileCache()
