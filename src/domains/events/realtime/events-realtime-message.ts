import type { RealtimeNotification } from '@/domains/events/types/events-realtime.types'
import { isRecord } from '@/domains/events/utils/event-payload'

export function parseRealtimeNotification(
  message: MessageEvent,
): RealtimeNotification | null {
  try {
    const value = JSON.parse(String(message.data)) as unknown

    if (!isRecord(value) || typeof value.type !== 'string') {
      return null
    }

    return {
      ...value,
      type: value.type,
    }
  } catch {
    return null
  }
}
