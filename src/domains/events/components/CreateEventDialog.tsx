import {CalendarPlus, LoaderCircle, X} from 'lucide-react'
import type {SubmitEventHandler} from 'react'

import {Button} from '@/components/ui/button'
import {countryOptions} from '@/domains/events/data/countries'
import type {AppUser, CreateEventInput,} from '@/domains/events/types/event.types'

interface CreateEventDialogProps {
    currentUser: AppUser
    open: boolean
    saving: boolean
    error: string | null
    onClose: () => void
    onCreate: (input: CreateEventInput) => void
}

export function CreateEventDialog({
                                      currentUser,
                                      open,
                                      saving,
                                      error,
                                      onClose,
                                      onCreate,
                                  }: CreateEventDialogProps) {
    if (!open) return null

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)

        onCreate({
            title: String(data.get('title')),
            scheduled_at: new Date(String(data.get('scheduled_at'))).toISOString(),
            duration_in_minutes: Math.round(Number(data.get('duration')) * 60),
            location: {
                name: String(data.get('location')),
                address: String(data.get('address')),
                country: String(data.get('country')),
                city: String(data.get('city')),
                postal_code: String(data.get('postal_code')).trim() || null,
            },
        })
    }

    return (
        <div
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6"
            role="dialog"
        >
            <div
                className="event-detail-enter max-h-[95vh] w-full max-w-140 overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#151915] p-6 shadow-2xl sm:rounded-[28px] sm:p-8">
                <div className="flex items-start justify-between">
                    <div>
            <span className="grid size-10 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
              <CalendarPlus className="size-4"/>
            </span>
                        <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em]">
                            Create your event
                        </h2>
                        <p className="mt-2 text-xs text-white/35">
                            It will be organized by {currentUser.name}.
                        </p>
                    </div>
                    <button
                        aria-label="Close"
                        className="grid size-9 place-items-center rounded-full border border-white/10 text-white/35 hover:bg-white/10 hover:text-white"
                        disabled={saving}
                        onClick={onClose}
                        type="button"
                    >
                        <X className="size-4"/>
                    </button>
                </div>

                <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                    <label className="block">
                        <span className="form-label">Event title</span>
                        <input
                            autoFocus
                            className="form-input"
                            name="title"
                            placeholder="Design systems meetup"
                            required
                        />
                    </label>
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_160px]">
                        <label className="block">
                            <span className="form-label">Date and time</span>
                            <input
                                className="form-input"
                                name="scheduled_at"
                                required
                                type="datetime-local"
                            />
                        </label>

                        <label className="block">
                            <span className="form-label">Duration in hours</span>
                            <input
                                className="form-input"
                                defaultValue="1.5"
                                min="0.25"
                                name="duration"
                                required
                                step="0.25"
                                type="number"
                            />
                        </label>
                    </div>
                    <label className="block">
                        <span className="form-label">Venue</span>
                        <input
                            className="form-input"
                            name="location"
                            placeholder="Factory Berlin"
                            required
                        />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="form-label">Country</span>
                            <select
                                className="form-input appearance-none"
                                defaultValue=""
                                name="country"
                                required
                            >
                                <option disabled value="">
                                    Select a country
                                </option>
                                {countryOptions.map((country) => (
                                    <option key={country.code} value={country.code}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="form-label">City</span>
                            <input
                                className="form-input"
                                maxLength={200}
                                name="city"
                                placeholder="Berlin"
                                required
                            />
                        </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                        <label className="block">
                            <span className="form-label">Address</span>
                            <input
                                className="form-input"
                                maxLength={500}
                                name="address"
                                placeholder="Lohmühlenstraße 65"
                                required
                            />
                        </label>
                        <label className="block">
                            <span className="form-label">Postal code</span>
                            <input
                                className="form-input"
                                maxLength={32}
                                name="postal_code"
                                placeholder="12435"
                            />
                        </label>
                    </div>

                    {error && (
                        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 pt-3">
                        <Button
                            className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                            disabled={saving}
                            onClick={onClose}
                            type="button"
                            variant="ghost"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-full bg-lime-300 px-6 font-extrabold text-zinc-950 hover:bg-lime-200"
                            disabled={saving}
                            type="submit"
                        >
                            {saving && <LoaderCircle className="size-4 animate-spin"/>}
                            Create event
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
