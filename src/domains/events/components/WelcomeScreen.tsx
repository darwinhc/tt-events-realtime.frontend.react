import {ArrowRight, UserRound, Zap} from 'lucide-react'
import {useState} from 'react'
import type {SubmitEventHandler} from "react";

import {Button} from '@/components/ui/button'

interface WelcomeScreenProps {
  onCreateUser: (name: string) => void
}

export function WelcomeScreen({ onCreateUser }: WelcomeScreenProps) {
  const [name, setName] = useState('')

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const normalizedName = name.trim().replace(/\s+/g, ' ')
    if (normalizedName) onCreateUser(normalizedName)
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#080b08]/70 p-5 backdrop-blur-md"
      role="dialog"
    >
      <div className="event-detail-enter w-full max-w-[430px] rounded-[28px] border border-white/10 bg-[#151915] p-7 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.9)] sm:p-9">
        <span className="grid size-11 place-items-center rounded-2xl bg-lime-300 text-zinc-950 shadow-[0_12px_35px_-15px_rgba(190,242,100,0.6)]">
          <Zap className="size-5 fill-current" />
        </span>

        <p className="mt-7 text-[9px] font-extrabold uppercase tracking-[0.18em] text-lime-300">
          Welcome to Events RealTime
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.045em] text-white">
          What should we call you?
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/35">
          Your name will identify you when creating or joining events.
        </p>

        <form className="mt-7" onSubmit={handleSubmit}>
          <label
            className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-white/35"
            htmlFor="user-name"
          >
            Your name
          </label>
          <div className="relative">
            <UserRound className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/25" />
            <input
              autoFocus
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.045] pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-lime-300/40"
              id="user-name"
              maxLength={64}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sofia Martinez"
              required
              value={name}
            />
          </div>
          <Button
            className="group mt-4 h-12 w-full rounded-full bg-lime-300 font-extrabold text-zinc-950 hover:bg-lime-200"
            disabled={!name.trim()}
            type="submit"
          >
            Continue
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>
      </div>
    </div>
  )
}
