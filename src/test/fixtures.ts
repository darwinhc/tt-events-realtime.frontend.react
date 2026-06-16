import type {AppUser, EventDetails, EventJoiner,} from '@/domains/events/types/event.types'

export const currentUser: AppUser = {
  id: 7,
  name: 'Sofia Martinez',
  initials: 'SM',
}

export const activeEvent: EventDetails = {
  id: 1,
  title: 'Realtime Product Salon',
  organizer: 'Alex Morgan',
  organizer_id: 3,
  duration_in_minutes: 120,
  location_id: 1,
  location: {
    id: 1,
    name: 'Factory Berlin',
    address: 'Lohmühlenstraße 65',
    country: 'DE',
    city: 'berlin',
    postal_code: '12435',
    coordinates: null,
  },
  scheduled_at: '2026-07-09T16:30:00Z',
  status: 'active',
  canceled_at: null,
  deletion_scheduled_at: null,
  joiners_count: 1,
}

export const canceledEvent: EventDetails = {
  ...activeEvent,
  id: 2,
  title: 'Canceled Gathering',
  status: 'canceled',
  canceled_at: '2026-06-12T12:00:00Z',
  scheduled_at: null,
  location: {
    id: 2,
    name: null,
    address: 'Remote',
    country: null,
    city: null,
    postal_code: null,
    coordinates: null,
  },
  joiners_count: 0,
}

export const joiner: EventJoiner = {
  id: 10,
  event_id: activeEvent.id,
  user_id: currentUser.id!,
  user_name: currentUser.name,
  left_at: null,
}
