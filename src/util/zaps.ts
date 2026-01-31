/**
 * Lightning Zaps Integration (NIP-57)
 * 
 * Ermöglicht das Senden von Lightning-Zahlungen (Zaps) an andere Spieler
 */

import * as NIP01 from './nostr/nip01'
import { NostrProfile, getLightningAddress } from './nostr_profiles'

export interface ZapRequest {
  recipient: string // Pubkey des Empfängers
  amount: number // Satoshis
  comment?: string
  lnurl?: string
}

export interface ZapInvoice {
  pr: string // Lightning payment request
  verify: string // Verification URL
}

/**
 * Erstellt eine Zap-Anfrage für einen Spieler
 */
export async function createZapRequest(
  profile: NostrProfile,
  amount: number,
  comment?: string
): Promise<ZapInvoice | null> {
  try {
    const lnAddress = getLightningAddress(profile)
    
    if (!lnAddress) {
      throw new Error('Spieler hat keine Lightning-Adresse')
    }

    // Parse Lightning Address
    let lnurl: string
    if (lnAddress.startsWith('lnurl')) {
      lnurl = lnAddress
    } else if (lnAddress.includes('@')) {
      // Convert lightning address to LNURL
      const [name, domain] = lnAddress.split('@')
      const url = `https://${domain}/.well-known/lnurlp/${name}`
      lnurl = url
    } else {
      throw new Error('Ungültige Lightning-Adresse')
    }

    // Fetch LNURL details
    const response = await fetch(lnurl)
    if (!response.ok) {
      throw new Error('LNURL-Server nicht erreichbar')
    }

    const lnurlData = await response.json()
    
    // Validate amount
    const minSendable = lnurlData.minSendable / 1000 // Convert from millisats
    const maxSendable = lnurlData.maxSendable / 1000
    
    if (amount < minSendable || amount > maxSendable) {
      throw new Error(`Betrag muss zwischen ${minSendable} und ${maxSendable} Sats sein`)
    }

    // Request invoice
    const callbackUrl = new URL(lnurlData.callback)
    callbackUrl.searchParams.set('amount', String(amount * 1000)) // Convert to millisats
    if (comment) {
      callbackUrl.searchParams.set('comment', comment)
    }

    const invoiceResponse = await fetch(callbackUrl.toString())
    if (!invoiceResponse.ok) {
      throw new Error('Rechnung konnte nicht erstellt werden')
    }

    const invoiceData = await invoiceResponse.json()
    
    if (invoiceData.status === 'ERROR') {
      throw new Error(invoiceData.reason || 'Unbekannter Fehler')
    }

    return {
      pr: invoiceData.pr,
      verify: invoiceData.verify || '',
    }
  } catch (error) {
    console.error('Failed to create zap request:', error)
    return null
  }
}

/**
 * Sendet einen Zap über WebLN (wenn verfügbar)
 */
export async function sendZapViaWebLN(invoice: string): Promise<boolean> {
  try {
    // @ts-ignore - WebLN ist möglicherweise nicht typisiert
    if (!window.webln) {
      throw new Error('WebLN nicht verfügbar')
    }

    // @ts-ignore
    await window.webln.enable()
    // @ts-ignore
    const result = await window.webln.sendPayment(invoice)
    
    return !!result.preimage
  } catch (error) {
    console.error('WebLN payment failed:', error)
    return false
  }
}

/**
 * Prüft ob WebLN verfügbar ist
 */
export function isWebLNAvailable(): boolean {
  // @ts-ignore
  return typeof window !== 'undefined' && !!window.webln
}

/**
 * Öffnet eine Lightning Wallet mit der Rechnung
 */
export function openLightningWallet(invoice: string): void {
  const lightningUrl = `lightning:${invoice}`
  window.open(lightningUrl, '_blank')
}

/**
 * Kopiert die Rechnung in die Zwischenablage
 */
export async function copyInvoiceToClipboard(invoice: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(invoice)
    return true
  } catch (error) {
    console.error('Failed to copy invoice:', error)
    return false
  }
}

/**
 * Generiert vorgeschlagene Zap-Beträge
 */
export function getSuggestedZapAmounts(): number[] {
  return [
    21,    // Meme-Betrag
    100,   // Klein
    500,   // Mittel
    1000,  // Groß
    5000,  // Sehr groß
    10000, // Mega
  ]
}
