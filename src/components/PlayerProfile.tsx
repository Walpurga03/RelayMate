import { useEffect, useState } from 'react'
import { Avatar } from 'react-daisyui'
import { 
  NostrProfile, 
  getCachedProfile, 
  cacheProfile, 
  parseMetadata, 
  formatDisplayName,
  createMetadataFilter,
  verifyNip05 
} from '../util/nostr_profiles'
import { useOutgoingNostrEvents } from '../context/NostrEventsContext'

interface PlayerProfileProps {
  pubkey: string
  showAvatar?: boolean
  showName?: boolean
  showNip05?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Zeigt ein Nostr-Benutzerprofil an
 */
export default function PlayerProfile({
  pubkey,
  showAvatar = true,
  showName = true,
  showNip05 = false,
  size = 'md',
  className = '',
}: PlayerProfileProps) {
  const [profile, setProfile] = useState<NostrProfile | null>(null)
  const [verified, setVerified] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const outgoingNostr = useOutgoingNostrEvents()

  useEffect(() => {
    // Versuche zuerst aus dem Cache zu laden
    const cached = getCachedProfile(pubkey)
    if (cached) {
      setProfile(cached.profile)
      setVerified(cached.verified || false)
      setLoading(false)
    }

    // Lade Profil von Relays
    const filter = createMetadataFilter([pubkey])
    
    const handleEvent = (event: any) => {
      const metadata = parseMetadata(event.content)
      setProfile(metadata)
      cacheProfile(pubkey, metadata)
      setLoading(false)

      // NIP-05 Verifikation im Hintergrund
      if (metadata.nip05) {
        verifyNip05(metadata.nip05, pubkey).then(setVerified)
      }
    }

    // TODO: Implementiere subscription mit outgoingNostr
    // Verwende outgoingNostr.emit() um REQ zu senden
    setLoading(false)

    return () => {
      // Cleanup subscription wenn Component unmounted
      // TODO: Implement unsubscribe in NostrEventsContext
    }
  }, [pubkey, outgoingNostr])

  const displayName = profile ? formatDisplayName(profile, pubkey) : formatPubkey(pubkey)
  
  const avatarSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
  }

  const avatarSize = avatarSizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showAvatar && (
        <Avatar
          size={avatarSize}
          shape="circle"
          src={profile?.picture}
          letters={displayName.substring(0, 2).toUpperCase()}
          border={verified}
          borderColor="success"
        />
      )}
      
      {showName && (
        <div className="flex flex-col">
          <span className="font-semibold">{displayName}</span>
          {showNip05 && profile?.nip05 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              {verified && <span className="text-success">✓</span>}
              {profile.nip05}
            </span>
          )}
        </div>
      )}
      
      {loading && !profile && (
        <span className="loading loading-spinner loading-xs"></span>
      )}
    </div>
  )
}

function formatPubkey(pubkey: string): string {
  if (pubkey.length < 16) {
    return pubkey
  }
  return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`
}
