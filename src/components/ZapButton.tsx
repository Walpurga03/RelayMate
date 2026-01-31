import { useState } from 'react'
import { Button, Modal, Badge } from 'react-daisyui'
import { NostrProfile } from '../util/nostr_profiles'
import {
  createZapRequest,
  sendZapViaWebLN,
  isWebLNAvailable,
  openLightningWallet,
  copyInvoiceToClipboard,
  getSuggestedZapAmounts,
} from '../util/zaps'

interface ZapButtonProps {
  profile: NostrProfile
  pubkey: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
  onZapSent?: (amount: number) => void
}

/**
 * Button zum Senden von Lightning Zaps
 */
export default function ZapButton({
  profile,
  pubkey,
  size = 'sm',
  showLabel = false,
  className = '',
  onZapSent,
}: ZapButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number>(100)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasWebLN = isWebLNAvailable()
  const suggestedAmounts = getSuggestedZapAmounts()

  const handleZap = async () => {
    setError(null)
    setLoading(true)

    try {
      const amount = customAmount ? parseInt(customAmount) : selectedAmount
      
      if (!amount || amount < 1) {
        setError('Ungültiger Betrag')
        return
      }

      const zapInvoice = await createZapRequest(profile, amount, comment)
      
      if (!zapInvoice) {
        setError('Zap-Anfrage konnte nicht erstellt werden')
        return
      }

      setInvoice(zapInvoice.pr)

      // Versuche automatisch über WebLN zu zahlen
      if (hasWebLN) {
        const success = await sendZapViaWebLN(zapInvoice.pr)
        if (success) {
          setShowModal(false)
          onZapSent?.(amount)
          setComment('')
          setCustomAmount('')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyInvoice = async () => {
    if (invoice) {
      const success = await copyInvoiceToClipboard(invoice)
      if (success) {
        // TODO: Show toast notification
        console.log('Rechnung kopiert!')
      }
    }
  }

  const handleOpenWallet = () => {
    if (invoice) {
      openLightningWallet(invoice)
    }
  }

  return (
    <>
      <Button
        size={size}
        color="warning"
        className={className}
        onClick={() => setShowModal(true)}
        startIcon={<span>⚡</span>}
      >
        {showLabel && 'Zap'}
      </Button>

      <Modal open={showModal} onClickBackdrop={() => setShowModal(false)}>
        <Modal.Header className="font-bold">
          ⚡ Zap senden
        </Modal.Header>

        <Modal.Body>
          {!invoice ? (
            <>
              <p className="mb-4">
                Sende Sats an diesen Spieler als Belohnung für eine gute Partie!
              </p>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Betrag (Sats)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestedAmounts.map(amount => (
                    <Badge
                      key={amount}
                      color={selectedAmount === amount && !customAmount ? 'primary' : 'ghost'}
                      className="cursor-pointer hover:bg-primary hover:text-primary-content"
                      onClick={() => {
                        setSelectedAmount(amount)
                        setCustomAmount('')
                      }}
                    >
                      {amount} ⚡
                    </Badge>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Eigener Betrag..."
                  className="input input-bordered w-full"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Kommentar (optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="Danke für das tolle Spiel!"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="alert alert-success mb-4">
                <span>⚡ Rechnung erstellt!</span>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Lightning Invoice</span>
                </label>
                <textarea
                  className="textarea textarea-bordered font-mono text-xs"
                  value={invoice}
                  readOnly
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleCopyInvoice}
                  className="flex-1"
                >
                  📋 Kopieren
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleOpenWallet}
                  className="flex-1"
                  color="primary"
                >
                  👛 Wallet öffnen
                </Button>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Actions>
          <Button onClick={() => setShowModal(false)} size="sm">
            Abbrechen
          </Button>
          {!invoice && (
            <Button
              color="primary"
              onClick={handleZap}
              loading={loading}
              disabled={loading}
              size="sm"
            >
              {hasWebLN ? '⚡ Zap senden' : '⚡ Rechnung erstellen'}
            </Button>
          )}
        </Modal.Actions>
      </Modal>
    </>
  )
}
