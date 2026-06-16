export interface EventLocation {
    id: number | null
    name: string | null
    address: string | null
    country: string | null
    city: string | null
    postal_code: string | null
    coordinates: {
        latitude: number
        longitude: number
    } | null
}

export interface EventDetails {
    id: number
    title: string
    organizer: string
    organizer_id: number
    duration_in_minutes: number
    location_id: number
    location: EventLocation
    scheduled_at: string | null
    status: 'active' | 'canceled'
    canceled_at: string | null
    deletion_scheduled_at: string | null
    joiners_count: number
}

export interface EventJoiner {
    id: number | null
    user_id: number
    user_name: string
    event_id: number
    left_at: string | null
}

export interface AppUser {
    id: number | null
    name: string
    initials: string
}

export interface CreateEventInput {
    title: string
    scheduled_at: string | null
    duration_in_minutes: number
    location: {
        name: string
        address: string
        country: string
        city: string
        postal_code: string | null
    }
}

export interface UpdateEventInput {
    title: string
    scheduled_at: string | null
    duration_in_minutes: number
}

export interface UpdateLocationInput {
    name: string | null
    address: string | null
    country: string | null
    city: string | null
    postal_code: string | null
}

export interface EditEventInput {
    event: UpdateEventInput
    location: UpdateLocationInput
}

export interface CreatedEvent {
    id: number | null
    title: string
    organizer: string
    organizer_id: number | null
    duration_in_minutes: number
    location_id: number | null
    scheduled_at: string | null
    status: 'active' | 'canceled'
    canceled_at: string | null
    deletion_scheduled_at: string | null
}
