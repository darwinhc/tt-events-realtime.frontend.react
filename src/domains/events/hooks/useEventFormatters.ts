import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type DateInput = string | number | Date | null | undefined

interface EventFormatters {

  formatEventDate: (value: DateInput) => FormattedEventDate
  formatTime: (value: DateInput) => string
  formatDuration: (durationInMinutes: number | null | undefined) => string
}

export interface FormattedEventDate {
  month: string
  day: string
  full: string
}

function resolveLocale(language: string | undefined): string {
  if (!language) {
    return 'en-US'
  }

  const normalizedLanguage = language.toLowerCase()

  if (normalizedLanguage.startsWith('de')) {
    return 'de-DE'
  }

  if (normalizedLanguage.startsWith('en')) {
    return 'en-US'
  }

  return normalizedLanguage
}

function parseDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function useEventFormatters(): EventFormatters {
  const { i18n, t } = useTranslation()



  return useMemo(() => {
    const locale = resolveLocale(i18n.resolvedLanguage ?? i18n.language)

    const monthFormatter = new Intl.DateTimeFormat(locale, {
      month: 'short',
    })

    const dayFormatter = new Intl.DateTimeFormat(locale, {
      day: '2-digit',
    })

    const fullDateFormatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })


    return {
      formatEventDate(value: DateInput): FormattedEventDate {
        const date = parseDate(value)

        if (date === null) {
          return {
            month: t('events.date.tbdMonth', 'TBD'),
            day: t('events.date.tbdDay', '--'),
            full: t('events.date.toBeDefined', 'Date to be defined'),
          }
        }

        return {
          month: monthFormatter.format(date),
          day: dayFormatter.format(date),
          full: fullDateFormatter.format(date),
        }
      },

      formatTime(value: DateInput): string {
        const date = parseDate(value)

        if (date === null) {
          return t('common.notAvailable', 'N/A')
        }

        return timeFormatter.format(date)
      },

      formatDuration(durationInMinutes: number | null | undefined): string {
        if (
          durationInMinutes === null ||
          durationInMinutes === undefined ||
          Number.isNaN(durationInMinutes)
        ) {
          return t('common.notAvailable', 'N/A')
        }

        if (durationInMinutes < 60) {
          return t('events.duration.minutes', {
            count: durationInMinutes,
            defaultValue: '{{count}} min',
          })
        }

        const hours = Math.floor(durationInMinutes / 60)
        const minutes = durationInMinutes % 60

        if (minutes === 0) {
          return t('events.duration.hours', {
            count: hours,
            defaultValue: '{{count}} h',
          })
        }

        return t('events.duration.hoursAndMinutes', {
          hours,
          minutes,
          defaultValue: '{{hours}} h {{minutes}} min',
        })
      },
    }
  }, [i18n.language, i18n.resolvedLanguage, t])
}