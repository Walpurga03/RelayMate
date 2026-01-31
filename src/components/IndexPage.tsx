import { useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIncomingNostrEvents } from '../context/NostrEventsContext'
import { Identity, useSettings } from '../context/SettingsContext'

import { GenerateRandomIdentityButton } from '../components/IdentityButtons'
import { GameById } from '../components/jester/GameById'
import { Spinner } from '../components/Spinner'
import { CurrentGameCard } from '../components/GameCard'
import { NoConnectionAlert } from '../components/NoConnectionAlert'
import { RoboHashImgWithLoader } from '../components/RoboHashImg'
import { CreateGameAndRedirectButtonHook } from '../components/CreateGameButton'

import { useSetWindowTitle } from '../hooks/WindowTitle'

import { getSession } from '../util/session'
import { pubKeyDisplayName } from '../util/app'

import { H1 } from './Headings'
import { Button } from 'react-daisyui'

function CreateIdentityStep() {
  const navigate = useNavigate()
  const generateRandomIdentityButtonRef = useRef<HTMLButtonElement>(null)

  const viewLobbyButtonClicked = () => navigate('/lobby')

  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-base-200/50 border border-base-300/60">
        <span className="font-semibold text-lg tracking-tight">jester</span>
        <span className="text-[11px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-primary/15 text-primary font-semibold">
          beta
        </span>
      </div>
      <div className="space-y-2">
        <H1>Chess on Nostr</H1>
        <p className="text-base-content/70 max-w-xl mx-auto">Create a key and play. No distractions.</p>
      </div>
      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
        <Button color="primary" size="lg" ref={generateRandomIdentityButtonRef} className="px-8">
          Start playing
          <GenerateRandomIdentityButton buttonRef={generateRandomIdentityButtonRef} />
        </Button>
        <Button color="secondary" variant="outline" size="lg" className="px-8" onClick={viewLobbyButtonClicked}>
          Browse lobby
        </Button>
      </div>
    </div>
  )
}

function LoginIdentityStep({ identity }: { identity: Identity }) {
  const navigate = useNavigate()
  const displayPubKey = useMemo(() => pubKeyDisplayName(identity.pubkey), [identity])
  const generateRandomIdentityButtonRef = useRef<HTMLButtonElement>(null)

  const loginButtonClicked = () => navigate('/login')
  const viewLobbyButtonClicked = () => navigate('/lobby')

  return (
    <>
      <div className="flex justify-center">
        <RoboHashImgWithLoader
          className="w-32 h-32 lg:w-48 lg:h-48 mb-2 rounded-full shadow-sm-gray bg-base-300"
          value={identity.pubkey}
          alt={displayPubKey}
        />
      </div>
      <div className="flex justify-center text-center">
        <H1>{`Welcome back, ${displayPubKey}.`}</H1>
      </div>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 my-6">
        <Button color="primary" size="lg" className="px-7" onClick={loginButtonClicked}>
          Continue
        </Button>
        <Button color="secondary" variant="outline" size="lg" ref={generateRandomIdentityButtonRef} className="px-7">
          New identity
          <GenerateRandomIdentityButton buttonRef={generateRandomIdentityButtonRef} />
        </Button>
        <Button color="ghost" variant="link" size="lg" className="px-6" onClick={viewLobbyButtonClicked}>
          Lobby
        </Button>
      </div>
    </>
  )
}

function IdentityStep({ identity }: { identity: Identity | null }) {
  if (identity === null) {
    return CreateIdentityStep()
  }
  return LoginIdentityStep({ identity })
}

function SetupCompleteStep({ identity }: { identity: Identity }) {
  const createNewGameButtonRef = useRef<HTMLButtonElement>(null)

  const settings = useSettings()
  const navigate = useNavigate()

  const displayPubKey = useMemo(() => pubKeyDisplayName(identity.pubkey), [identity])
  const currentJesterId = settings.currentGameJesterId || ''

  const viewLobbyButtonClicked = () => navigate('/lobby')

  return (
    <>
      <div className="grid grid-cols-1 justify-center justify-items-center content-center">
        <RoboHashImgWithLoader
          className="w-32 h-32 lg:w-48 lg:h-48 mb-2 rounded-full shadow-sm-gray bg-base-300"
          value={identity.pubkey}
          alt={displayPubKey}
        />
      </div>
      <div className="flex justify-center text-center">
        <H1>{`Hello, ${displayPubKey}.`}</H1>
      </div>

      <GameById jesterId={settings.currentGameJesterId || null}>
        {(game) => {
          if (game === undefined) return <Spinner />

          if (game === null) {
            return (
              <>
                <div className="mt-6 mb-4 flex justify-center text-center text-base-content/80">
                  <span className="font-semibold">No active game. Start one or enter the lobby.</span>
                </div>
                <div className="grid grid-cols-1 justify-items-center space-y-3">
                  <Button
                    color="primary"
                    size="lg"
                    className="w-full max-w-sm"
                    ref={createNewGameButtonRef}
                  >
                    Start a new game
                    <CreateGameAndRedirectButtonHook buttonRef={createNewGameButtonRef} />
                  </Button>
                  <Button
                    color="secondary"
                    variant="outline"
                    size="lg"
                    className="w-full max-w-sm"
                    onClick={viewLobbyButtonClicked}
                  >
                    Browse lobby
                  </Button>
                </div>
              </>
            )
          }

          return (
            <>
              <div className="mt-6 mb-3 flex justify-center text-center text-base-content/80">
                <span className="font-semibold">Game in progress. Resume and continue.</span>
              </div>
              <div className="flex justify-center my-2">
                <CurrentGameCard game={game} />
              </div>
              <div className="flex justify-center mt-3">
                <Button
                  color="primary"
                  size="lg"
                  disabled={!currentJesterId}
                  onClick={() => currentJesterId && navigate(`/game/${currentJesterId}`)}
                >
                  Open game
                </Button>
              </div>
            </>
          )
        }}
      </GameById>
    </>
  )
}

export default function IndexPage() {
  useSetWindowTitle({ text: 'chess over nostr' })

  const incomingNostr = useIncomingNostrEvents()
  const settings = useSettings()

  const identity = useMemo(() => settings.identity || null, [settings])
  const privateKeyOrNull = getSession()?.privateKey || null

  const showIdentityStep = identity === null || privateKeyOrNull === null

  return (
    <div className="screen-index">
      <div className="flex justify-center items-center">
        <div className="w-full grid grid-cols-1">
          {!incomingNostr && <NoConnectionAlert />}
          <div className="mt-2">
            {showIdentityStep ? <IdentityStep identity={identity} /> : <SetupCompleteStep identity={identity} />}
          </div>
        </div>
      </div>
    </div>
  )
}
