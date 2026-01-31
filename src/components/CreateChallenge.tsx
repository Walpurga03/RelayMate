import { useState } from 'react'
import { Button, Card, Input, Textarea, Select, Checkbox } from 'react-daisyui'

interface CreateChallengeProps {
  onCreateChallenge: (challenge: ChallengeData) => Promise<void>
}

export interface ChallengeData {
  content: string
  timeControl?: string
  color?: 'white' | 'black' | 'random'
  rated: boolean
}

const TIME_CONTROLS = [
  { value: '1+0', label: '1+0 (Bullet)' },
  { value: '3+0', label: '3+0 (Blitz)' },
  { value: '5+0', label: '5+0 (Blitz)' },
  { value: '10+0', label: '10+0 (Rapid)' },
  { value: '15+10', label: '15+10 (Rapid)' },
  { value: '30+0', label: '30+0 (Classical)' },
  { value: 'unlimited', label: 'Unbegrenzt' },
]

/**
 * Formular zum Erstellen einer Schach-Herausforderung
 */
export default function CreateChallenge({ onCreateChallenge }: CreateChallengeProps) {
  const [content, setContent] = useState('')
  const [timeControl, setTimeControl] = useState<string>('10+0')
  const [color, setColor] = useState<'white' | 'black' | 'random'>('random')
  const [rated, setRated] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      await onCreateChallenge({
        content,
        timeControl,
        color,
        rated,
      })
      
      // Reset form
      setContent('')
      setTimeControl('10+0')
      setColor('random')
      setRated(false)
    } catch (error) {
      console.error('Failed to create challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-base-100 shadow-xl">
      <Card.Body>
        <Card.Title>Neue Herausforderung erstellen</Card.Title>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nachricht (optional)</span>
            </label>
            <Textarea
              placeholder="Ich suche einen Gegner für eine schnelle Partie..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="textarea textarea-bordered"
              rows={3}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Zeitkontrolle</span>
            </label>
            <Select
              value={timeControl}
              onChange={e => setTimeControl(e.target.value)}
              className="select select-bordered w-full"
            >
              {TIME_CONTROLS.map(tc => (
                <option key={tc.value} value={tc.value}>
                  {tc.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Farbe</span>
            </label>
            <Select
              value={color}
              onChange={e => setColor(e.target.value as 'white' | 'black' | 'random')}
              className="select select-bordered w-full"
            >
              <option value="random">⚪⚫ Zufällig</option>
              <option value="white">⚪ Weiß</option>
              <option value="black">⚫ Schwarz</option>
            </Select>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <Checkbox
                checked={rated}
                onChange={e => setRated(e.target.checked)}
                className="checkbox checkbox-primary"
              />
              <span className="label-text">📊 Bewertetes Spiel (Rated)</span>
            </label>
          </div>

          <Card.Actions className="justify-end pt-4">
            <Button 
              type="submit" 
              color="primary" 
              loading={loading}
              disabled={loading}
            >
              Herausforderung veröffentlichen
            </Button>
          </Card.Actions>
        </form>
      </Card.Body>
    </Card>
  )
}
