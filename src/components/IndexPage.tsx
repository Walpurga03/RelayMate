import { useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIncomingNostrEvents } from '../context/NostrEventsContext'
import { Identity, useSettings } from '../context/SettingsContext'
import ROUTES from '../routes'

import { GenerateRandomIdentityButton } from '../components/IdentityButtons'
import { GameById } from '../components/jester/GameById'
import { Spinner } from '../components/Spinner'
import { CurrentGameCard } from '../components/GameCard'
import { NoConnectionAlert } from '../components/NoConnectionAlert'
import { RoboHashImgWithLoader } from '../components/RoboHashImg'
import {
  CreateDirectChallengeAndRedirectButtonHook,
  CreateGameAndRedirectButtonHook,
} from '../components/CreateGameButton'

import { useSetWindowTitle } from '../hooks/WindowTitle'

import { getSession } from '../util/session'
import { createPersonalBotKeyPair, pubKeyDisplayName } from '../util/app'
import { PubKey } from '../util/nostr/nip01'

import { H1 } from './Headings'
import { Button } from 'react-daisyui'

function CreateIdentityStep() {
  const navigate = useNavigate()

  const generateRandomIdentityButtonRef = useRef<HTMLButtonElement>(null)

  const viewLobbyButtonClicked = () => navigate(`/lobby`)

  return (
    <>
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-base-200/50 border border-base-300/60">
          <span className="font-semibold text-lg tracking-tight">jester</span>
          <span className="text-[11px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-primary/15 text-primary font-semibold">
            beta
          </span>
        </div>
        <div className="space-y-2">
          <H1>Chess on Nostr</H1>
          <p className="text-base-content/70 max-w-xl mx-auto">
            Create a key, sit at the board, and play. No distractions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          <Button
            color="primary"
            size="lg"
            ref={generateRandomIdentityButtonRef}
            className="px-8"
          >
            Start playing
            <GenerateRandomIdentityButton buttonRef={generateRandomIdentityButtonRef} />
          </Button>
          <Button color="secondary" variant="outline" size="lg" className="px-8" onClick={viewLobbyButtonClicked}>
            Browse lobby
          </Button>
        </div>
      </div>
    </>
  )
}

function LoginIdentityStep({ identity }: { identity: Identity }) {
  const navigate = useNavigate()
  const displayPubKey = useMemo(() => pubKeyDisplayName(identity.pubkey), [identity])

  const generateRandomIdentityButtonRef = useRef<HTMLButtonElement>(null)

  const loginButtonClicked = () => navigate(`/login`)
  const viewLobbyButtonClicked = () => navigate(`/lobby`)

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
        <H1>{`Welcome back, ${pubKeyDisplayName(identity.pubkey)}.`}</H1>
      </div>
      <div className="mt-4 mb-6 flex justify-center text-center max-w-2xl mx-auto text-base-content/70">
        <span>Import your key or create a new one. Jump into lobby or continue your games.</span>
      </div>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 my-4">
        <Button color="primary" size="lg" className="px-7" onClick={loginButtonClicked}>
          Login
        </Button>
        <Button color="secondary" variant="outline" size="lg" ref={generateRandomIdentityButtonRef} className="px-7">
          New identity
          <GenerateRandomIdentityButton buttonRef={generateRandomIdentityButtonRef} />
        </Button>
        <Button color="ghost" variant="link" size="lg" className="px-6" onClick={viewLobbyButtonClicked}>
          Browse lobby
        </Button>
      </div>
    </>
  )
}

function IdentityStep({ identity }: { identity: Identity | null }) {
  if (identity === null) {
    return CreateIdentityStep()
  } else {
    return LoginIdentityStep({ identity })
  }
}

function SetupCompleteStep({ identity }: { identity: Identity }) {
  const createNewGameButtonRef = useRef<HTMLButtonElement>(null)
  const challengePersonalRobotButtonRef = useRef<HTMLButtonElement>(null)
  // const challengeJesterButtonRef = useRef<HTMLButtonElement>(null)

  const settings = useSettings()
  const navigate = useNavigate()

  const displayPubKey = useMemo(() => pubKeyDisplayName(identity.pubkey), [identity])
  const privateKey = getSession()!.privateKey!

  const personalRobotPublicKey = useMemo<PubKey>(() => {
    return createPersonalBotKeyPair(privateKey).publicKey
  }, [privateKey])

  const viewLobbyButtonClicked = () => navigate(`/lobby`)

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
          if (game === undefined) {
            return <Spinner />
          } else if (game === null) {
            return (
              <>
                <div className="mt-6 mb-4 flex justify-center text-center text-base-content/80">
                  <span className="font-semibold">Ready to play? Challenge your personal bot or start a fresh game.</span>
                </div>
                <div className="grid grid-cols-1 justify-items-center space-y-4">
                  {/*
                    <>
                      <Button
                        color="gray"
                        buttonType="link"
                        size="lg"
                        rounded={false}
                        block={false}
                        iconOnly={false}
                        ripple="light"
                        className="w-full max-w-sm"
                        ref={challengeJesterButtonRef}
                      >
                        Challenge Jester
                      </Button>

                      <Popover placement="top" ref={challengeJesterButtonRef} trigger={'hover'}>
                        <PopoverContainer style={{ position: 'absolute', margin: '0 auto' }}>
                          <PopoverHeader>Challenge declined.</PopoverHeader>
                          <PopoverBody>
                            <figure>
                              <blockquote cite="https://www.example.com">
                                <p>
                                  "It's an entire world of 64 squares. I will dominate it and crush my opponent’s mind."
                                </p>
                              </blockquote>
                              <figcaption>—Jester</figcaption>
                            </figure>
                            <p className="mt-2">Jester laughs and declines your challenge. You are not ready yet.</p>
                          </PopoverBody>
                        </PopoverContainer>
                      </Popover>
                    </>
                  */}
                  <Button color="accent" size="lg" className="w-full max-w-sm" ref={challengePersonalRobotButtonRef}>
                    Challenge your robot
                    <CreateDirectChallengeAndRedirectButtonHook
                      buttonRef={challengePersonalRobotButtonRef}
                      opponentPubKey={personalRobotPublicKey}
                    />
                  </Button>
                </div>

                <div className="mt-6 mb-4 flex justify-center text-center text-base-content/70">
                  <span className="font-semibold">Prefer a human? Enter the lobby or start fresh.</span>
                </div>
                <div className="grid grid-cols-1 justify-items-center space-y-4">
                  <Button
                    color="ghost"
                    variant="outline"
                    size="lg"
                    className="w-full max-w-sm"
                    onClick={viewLobbyButtonClicked}
                  >
                    Browse all games
                  </Button>
                  <Button
                    color="success"
                    variant="outline"
                    size="lg"
                    className="w-full max-w-sm"
                    ref={createNewGameButtonRef}
                  >
                    Start a new game
                    <CreateGameAndRedirectButtonHook buttonRef={createNewGameButtonRef} />
                  </Button>
                </div>
              </>
            )
          } else {
            return (
              <>
                <div className="mt-6 mb-4 flex justify-center text-center">
                  <span className="font-bold">Game is active…</span>
                </div>
                <div className="flex justify-center my-2">
                  <CurrentGameCard game={game} />
                </div>
              </>
            )
          }
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
