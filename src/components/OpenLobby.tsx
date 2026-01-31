import { useEffect, useState } from 'react'
import { Card, Button, Badge } from 'react-daisyui'
import { useOutgoingNostrEvents } from '../context/NostrEventsContext'
import PlayerProfile from './PlayerProfile'
import * as NIP01 from '../util/nostr/nip01'

// Hashtag für offene Herausforderungen
const CHALLENGE_HASHTAG = '#NostrChessChallenge'
const CHALLENGE_KIND: NIP01.Kind = 1

interface ChessChallenge {
  id: string
  pubkey: string
  content: string
  created_at: number
  tags: string[][]
  timeControl?: string // z.B. "5+0", "10+5"
  color?: 'white' | 'black' | 'random'
  rated?: boolean
}

/**
 * Open Lobby - Zeigt offene Schach-Herausforderungen an
 */
export default function OpenLobby() {
  const [challenges, setChallenges] = useState<ChessChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const outgoingNostr = useOutgoingNostrEvents()

  useEffect(() => {
    // Filter für offene Herausforderungen
    const filter: NIP01.Filter = {
      kinds: [CHALLENGE_KIND],
      '#t': ['NostrChessChallenge', 'chess', 'jester'],
      limit: 50,
    }

    const handleEvent = (event: any) => {
      const challenge: ChessChallenge = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        created_at: event.created_at,
        tags: event.tags,
        timeControl: extractTimeControl(event.tags),
        color: extractColor(event.tags),
        rated: extractRated(event.tags),
      }

      setChallenges(prev => {
        // Verhindere Duplikate
        if (prev.some(c => c.id === challenge.id)) {
          return prev
        }
        return [challenge, ...prev].sort((a, b) => b.created_at - a.created_at)
      })
      setLoading(false)
    }

    // TODO: Implementiere subscription mit outgoingNostr
    // Verwende outgoingNostr.emit() um REQ zu senden
    setLoading(false)

    return () => {
      // TODO: Cleanup subscription
    }
  }, [outgoingNostr])

  const handleAcceptChallenge = (challenge: ChessChallenge) => {
    // TODO: Implementiere Spiel-Akzeptanz-Logik
    console.log('Accepting challenge:', challenge)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Open Lobby</h1>
        <p className="text-gray-600">
          Offene Herausforderungen von Nostr-Spielern. Klicke auf "Annehmen", um ein Spiel zu starten.
        </p>
      </div>

      {loading && challenges.length === 0 && (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {!loading && challenges.length === 0 && (
        <Card className="bg-base-200">
          <Card.Body>
            <Card.Title>Keine offenen Herausforderungen</Card.Title>
            <p>Erstelle eine eigene Herausforderung, um andere Spieler einzuladen!</p>
          </Card.Body>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onAccept={() => handleAcceptChallenge(challenge)}
          />
        ))}
      </div>
    </div>
  )
}

interface ChallengeCardProps {
  challenge: ChessChallenge
  onAccept: () => void
}

function ChallengeCard({ challenge, onAccept }: ChallengeCardProps) {
  const timeAgo = formatTimeAgo(challenge.created_at)

  return (
    <Card className="bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
      <Card.Body>
        <div className="flex justify-between items-start mb-4">
          <PlayerProfile 
            pubkey={challenge.pubkey} 
            showAvatar={true}
            showName={true}
            size="md"
          />
          <Badge color="ghost" className="text-xs">
            {timeAgo}
          </Badge>
        </div>

        {challenge.content && (
          <p className="text-sm mb-3 line-clamp-2">{challenge.content}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {challenge.timeControl && (
            <Badge color="primary" size="sm">
              ⏱️ {challenge.timeControl}
            </Badge>
          )}
          {challenge.color && (
            <Badge color="secondary" size="sm">
              {challenge.color === 'white' ? '⚪' : challenge.color === 'black' ? '⚫' : '🎲'} 
              {' '}{challenge.color}
            </Badge>
          )}
          {challenge.rated && (
            <Badge color="accent" size="sm">
              📊 Rated
            </Badge>
          )}
        </div>

        <Card.Actions className="justify-end">
          <Button color="primary" size="sm" onClick={onAccept}>
            Annehmen
          </Button>
        </Card.Actions>
      </Card.Body>
    </Card>
  )
}

function extractTimeControl(tags: string[][]): string | undefined {
  const timeTag = tags.find(tag => tag[0] === 'time')
  return timeTag ? timeTag[1] : undefined
}

function extractColor(tags: string[][]): 'white' | 'black' | 'random' | undefined {
  const colorTag = tags.find(tag => tag[0] === 'color')
  if (!colorTag) return undefined
  const value = colorTag[1].toLowerCase()
  if (value === 'white' || value === 'black' || value === 'random') {
    return value as 'white' | 'black' | 'random'
  }
  return undefined
}

function extractRated(tags: string[][]): boolean {
  return tags.some(tag => tag[0] === 'rated')
}

function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'gerade eben'
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`
  return `vor ${Math.floor(diff / 86400)} Tagen`
}
