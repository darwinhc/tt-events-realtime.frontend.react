import {CalendarPlus, LoaderCircle, X} from 'lucide-react'
import {type SubmitEventHandler, useCallback, useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'

import {parseOptionalScheduledAt, toIsoStringOrNull} from '@/domains/events/utils/event-formatters'
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
  const {t} = useTranslation()
  const [formError, setFormError] = useState<string | null>(null)
  const formErrorTimerRef = useRef<number | null>(null)

  const clearFormErrorTimer = useCallback(() => {
    if (formErrorTimerRef.current !== null) {
      window.clearTimeout(formErrorTimerRef.current)
      formErrorTimerRef.current = null
    }
  }, [])

  const showFormError = useCallback(
    (message: string) => {
      clearFormErrorTimer()
      setFormError(message)

      formErrorTimerRef.current = window.setTimeout(() => {
        setFormError(null)
        formErrorTimerRef.current = null
      }, 5000)
    },
    [clearFormErrorTimer],
  )

  useEffect(() => {
    return () => {
      clearFormErrorTimer()
    }
  }, [clearFormErrorTimer])

  if (!open) return null

  const handleClose = () => {
    clearFormErrorTimer()
    setFormError(null)
    onClose()
  }

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    const scheduledAt = parseOptionalScheduledAt(
      data.get('scheduled_date'),
      data.get('scheduled_time'),
    )
    const durationInMinutes = Math.round(Number(data.get('duration')) * 60)
    const now = new Date()

    if (
      scheduledAt !== null &&
      scheduledAt.getTime() + durationInMinutes * 60 * 1000 < now.getTime()
    ) {
      showFormError(t('createEventDialog.errors.eventMustNotEndInPast'))
      return
    }

    clearFormErrorTimer()
    setFormError(null)

    onCreate({
      title: String(data.get('title') ?? '').trim(),
      scheduled_at: toIsoStringOrNull(scheduledAt),
      duration_in_minutes: durationInMinutes,
      location: {
        name: String(data.get('location') ?? '').trim(),
        address: String(data.get('address') ?? '').trim(),
        country: String(data.get('country') ?? '').trim(),
        city: String(data.get('city') ?? '').trim(),
        postal_code: String(data.get('postal_code') ?? '').trim() || null,
      },
    })
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-black/75 px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
    >
      <div
        className="event-detail-enter max-h-[95vh] w-full max-w-[min(100%,35rem)] overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/10 bg-[#151915] p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="grid size-10 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
              <CalendarPlus className="size-4"/>
            </span>

            <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em]">
              {t('createEventDialog.title')}
            </h2>

            <p className="mt-2 text-xs text-white/35">
              {t('createEventDialog.organizedBy', {
                name: currentUser.name,
              })}
            </p>
          </div>

          <button
            aria-label={t('common.close')}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/35 hover:bg-white/10 hover:text-white"
            disabled={saving}
            onClick={handleClose}
            type="button"
          >
            <X className="size-4"/>
          </button>
        </div>

        <form className="mt-7 min-w-0 space-y-4 pb-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="form-label">
              {t('createEventDialog.eventTitle')}
            </span>

            <input
              className="form-input"
              name="title"
              placeholder={t('createEventDialog.eventTitlePlaceholder')}
              required
            />
          </label>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_160px]">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="form-label">
                  {t('createEventDialog.date')}
                </span>

                <input
                  className="form-input"
                  name="scheduled_date"
                  type="date"
                />
              </label>

              <label className="block">
                <span className="form-label">
                  {t('createEventDialog.time')}
                </span>

                <input
                  className="form-input"
                  name="scheduled_time"
                  type="time"
                />
              </label>
            </div>

            <label className="block">
              <span className="form-label">
                {t('createEventDialog.durationInHours')}
              </span>

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
            <span className="form-label">
              {t('createEventDialog.venue')}
            </span>

            <input
              className="form-input"
              name="location"
              placeholder={t('createEventDialog.venuePlaceholder')}
              required
            />
          </label>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="form-label">
                {t('createEventDialog.country')}
              </span>

              <select
                className="form-input appearance-none"
                defaultValue=""
                name="country"
                required
              >
                <option disabled value="">
                  {t('createEventDialog.selectCountry')}
                </option>

                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="form-label">
                {t('createEventDialog.city')}
              </span>

              <input
                className="form-input"
                maxLength={200}
                name="city"
                placeholder={t('createEventDialog.cityPlaceholder')}
                required
              />
            </label>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
            <label className="block">
              <span className="form-label">
                {t('createEventDialog.address')}
              </span>

              <input
                className="form-input"
                maxLength={500}
                name="address"
                placeholder={t('createEventDialog.addressPlaceholder')}
              />
            </label>

            <label className="block">
              <span className="form-label">
                {t('createEventDialog.postalCode')}
              </span>

              <input
                className="form-input"
                maxLength={32}
                name="postal_code"
                placeholder={t('createEventDialog.postalCodePlaceholder')}
              />
            </label>
          </div>

          {(formError || error) && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-300">
              {formError || error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"
              disabled={saving}
              onClick={handleClose}
              type="button"
              variant="ghost"
            >
              {t('common.cancel')}
            </Button>

            <Button
              className="rounded-full bg-lime-300 px-6 font-extrabold text-zinc-950 hover:bg-lime-200"
              disabled={saving}
              type="submit"
            >
              {saving && <LoaderCircle className="size-4 animate-spin"/>}
              {t('common.createEvent')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}