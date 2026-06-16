import type {EventDetails, EventJoiner} from "@/domains/events/types/event.types.ts";


export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

export function mergeEventPayload(
  event: EventDetails,
  payload: Record<string, unknown>,
): EventDetails {
  return {
    ...event,
    title: typeof payload.title === 'string' ? payload.title : event.title,
    duration_in_minutes:
      typeof payload.duration_in_minutes === 'number'
        ? payload.duration_in_minutes
        : event.duration_in_minutes,
    scheduled_at:
      typeof payload.scheduled_at === 'string' ||
      payload.scheduled_at === null
        ? payload.scheduled_at
        : event.scheduled_at,
    status:
      payload.status === 'active' || payload.status === 'canceled'
        ? payload.status
        : event.status,
    canceled_at:
      typeof payload.canceled_at === 'string' || payload.canceled_at === null
        ? payload.canceled_at
        : event.canceled_at,
    deletion_scheduled_at:
      typeof payload.deletion_scheduled_at === 'string' ||
      payload.deletion_scheduled_at === null
        ? payload.deletion_scheduled_at
        : event.deletion_scheduled_at,
  }
}

export function parseJoiner(value: unknown): EventJoiner | null {
  if (
    !isRecord(value) ||
    typeof value.user_id !== 'number' ||
    typeof value.user_name !== 'string' ||
    typeof value.event_id !== 'number'
  ) {
    return null
  }
  return {
    id: typeof value.id === 'number' ? value.id : null,
    user_id: value.user_id,
    user_name: value.user_name,
    event_id: value.event_id,
    left_at: typeof value.left_at === 'string' ? value.left_at : null,
  }
}
