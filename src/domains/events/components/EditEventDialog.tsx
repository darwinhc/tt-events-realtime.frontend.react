import {CalendarClock, LoaderCircle, X} from 'lucide-react'
import type {SubmitEventHandler} from 'react'
import {useTranslation} from 'react-i18next'

import {Button} from '@/components/ui/button'
import {countryOptions} from '@/domains/events/data/countries'
import type {EditEventInput, EventDetails,} from '@/domains/events/types/event.types'

interface EditEventDialogProps {
  event: EventDetails
  open: boolean
  saving: boolean
  error: string | null
  onClose: () => void
  onUpdate: (input: EditEventInput) => void
}

function toLocalDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function EditEventDialog({
                                  event,
                                  open,
                                  saving,
                                  error,
                                  onClose,
                                  onUpdate,
                                }: EditEventDialogProps) {
  const {t} = useTranslation()

  if (!open) return null

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (submitEvent) => {
    submitEvent.preventDefault()
    const data = new FormData(submitEvent.currentTarget)
    const scheduledAt = String(data.get('scheduled_at'))
    const name = String(data.get('location')).trim()
    const address = String(data.get('address')).trim()

    if (!name && !address) {
      const nameInput = submitEvent.currentTarget.elements.namedItem('location')

      if (nameInput instanceof HTMLInputElement) {
        nameInput.setCustomValidity(
          t('editEventDialog.validation.locationRequired'),
        )
        nameInput.reportValidity()
        nameInput.addEventListener(
          'input',
          () => nameInput.setCustomValidity(''),
          {once: true},
        )
      }

      return
    }

    onUpdate({
      event: {
        title: String(data.get('title')).trim(),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        duration_in_minutes: Math.round(Number(data.get('duration')) * 60),
      },
      location: {
        name: name || null,
        address: address || null,
        country: String(data.get('country')).trim() || null,
        city: String(data.get('city')).trim() || null,
        postal_code: String(data.get('postal_code')).trim() || null,
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
              <CalendarClock className="size-4"/>
            </span>

            <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em]">
              {t('editEventDialog.title')}
            </h2>

            <p className="mt-2 text-xs text-white/35">
              {t('editEventDialog.description')}
            </p>
          </div>

          <button
            aria-label={t('common.close')}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-white/35 hover:bg-white/10 hover:text-white"
            disabled={saving}
            onClick={onClose}
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
              defaultValue={event.title}
              maxLength={250}
              name="title"
              required
            />
          </label>

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_160px]">
            <label className="min-w-0">
              <span className="form-label">
                {t('createEventDialog.dateAndTime')}
              </span>

              <input
                className="form-input datetime-input scheme-dark"
                defaultValue={toLocalDateTime(event.scheduled_at)}
                name="scheduled_at"
                type="datetime-local"
              />
            </label>

            <label className="min-w-0">
              <span className="form-label">
                {t('createEventDialog.durationInHours')}
              </span>

              <input
                className="form-input"
                defaultValue={event.duration_in_minutes / 60}
                min="0.25"
                name="duration"
                required
                step="0.25"
                type="number"
              />
            </label>
          </div>

          <div className="border-t border-white/8 pt-5">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-lime-300">
              {t('editEventDialog.currentLocation')}
            </p>

            <p className="mt-2 text-[11px] leading-5 text-white/30">
              {t('editEventDialog.sharedLocationWarning')}
            </p>
          </div>

          <label className="block">
            <span className="form-label">
              {t('createEventDialog.venue')}
            </span>

            <input
              className="form-input"
              defaultValue={event.location.name ?? ''}
              maxLength={200}
              name="location"
              placeholder={t('createEventDialog.venuePlaceholder')}
            />
          </label>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="form-label">
                {t('createEventDialog.country')}
              </span>

              <select
                className="form-input appearance-none"
                defaultValue={event.location.country ?? ''}
                name="country"
              >
                <option value="">
                  {t('editEventDialog.noCountrySelected')}
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
                defaultValue={event.location.city ?? ''}
                maxLength={200}
                name="city"
                placeholder={t('createEventDialog.cityPlaceholder')}
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
                defaultValue={event.location.address ?? ''}
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
                defaultValue={event.location.postal_code ?? ''}
                maxLength={32}
                name="postal_code"
                placeholder={t('createEventDialog.postalCodePlaceholder')}
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
              {t('common.cancel')}
            </Button>

            <Button
              className="rounded-full bg-lime-300 px-6 font-extrabold text-zinc-950 hover:bg-lime-200"
              disabled={saving}
              type="submit"
            >
              {saving && <LoaderCircle className="size-4 animate-spin"/>}
              {t('editEventDialog.saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}