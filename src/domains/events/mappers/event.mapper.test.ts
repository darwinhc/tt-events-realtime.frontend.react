import {describe, expect, it} from 'vitest'

import type {
  CreatedEventResponse,
  EventDetailsResponse,
  EventJoinerInfoResponse,
  EventJoinerResponse,
  EventLocationResponse,
} from '@/domains/events/api/events-api.types.ts'
import {
  groupJoinersByEventId,
  mapCreatedEventResponse,
  mapEventDetailsResponse,
  mapEventDetailsResponses,
  mapEventJoinerInfoResponse,
  mapEventJoinerInfoResponses,
  mapEventJoinerResponse,
  mapEventJoinerResponses,
  mapEventLocationResponse,
} from '@/domains/events/mappers/event.mapper.ts'

describe('event mapper', () => {
  const locationResponse: EventLocationResponse = {
    id: 1,
    name: 'Factory Berlin',
    address: 'Lohmühlenstraße 65',
    country: 'DE',
    city: 'Berlin',
    postal_code: '12435',
    coordinates: {
      latitude: 52.498,
      longitude: 13.449,
    },
    created_at: '2026-06-17T12:32:16.268Z',
  }

  const eventDetailsResponse: EventDetailsResponse = {
    id: 10,
    title: 'Realtime Product Salon',
    organizer: 'Alex Morgan',
    organizer_id: 3,
    duration_in_minutes: 120,
    location_id: 1,
    location: locationResponse,
    scheduled_at: '2026-07-09T16:30:00Z',
    status: 'active',
    canceled_at: null,
    deletion_scheduled_at: null,
    joiners_count: 2,
  }

  const createdEventResponse: CreatedEventResponse = {
    id: 11,
    title: 'New meetup',
    organizer: 'Sofia Martinez',
    organizer_id: 7,
    duration_in_minutes: 90,
    location_id: 4,
    scheduled_at: null,
    status: 'active',
    canceled_at: null,
    deletion_scheduled_at: null,
  }

  it('maps an API location response to an event location', () => {
    expect(mapEventLocationResponse(locationResponse)).toEqual({
      id: 1,
      name: 'Factory Berlin',
      address: 'Lohmühlenstraße 65',
      country: 'DE',
      city: 'Berlin',
      postal_code: '12435',
      coordinates: {
        latitude: 52.498,
        longitude: 13.449,
      },
    })
  })

  it('maps an API event details response to the frontend event model', () => {
    expect(mapEventDetailsResponse(eventDetailsResponse)).toEqual({
      id: 10,
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
        city: 'Berlin',
        postal_code: '12435',
        coordinates: {
          latitude: 52.498,
          longitude: 13.449,
        },
      },
      scheduled_at: '2026-07-09T16:30:00Z',
      status: 'active',
      canceled_at: null,
      deletion_scheduled_at: null,
      joiners_count: 2,
    })
  })

  it('maps a list of API event details responses', () => {
    expect(mapEventDetailsResponses([eventDetailsResponse])).toEqual([
      mapEventDetailsResponse(eventDetailsResponse),
    ])
  })

  it('maps a created event response to the created event model', () => {
    expect(mapCreatedEventResponse(createdEventResponse)).toEqual({
      id: 11,
      title: 'New meetup',
      organizer: 'Sofia Martinez',
      organizer_id: 7,
      duration_in_minutes: 90,
      location_id: 4,
      scheduled_at: null,
      status: 'active',
      canceled_at: null,
      deletion_scheduled_at: null,
    })
  })

  it('maps full joiner responses', () => {
    const joinerResponse: EventJoinerResponse = {
      id: 20,
      event_id: 10,
      user_id: 7,
      user_name: 'Sofia Martinez',
      joined_at: '2026-06-17T12:32:16.268Z',
      left_at: null,
    }

    expect(mapEventJoinerResponse(joinerResponse)).toEqual({
      id: 20,
      event_id: 10,
      user_id: 7,
      user_name: 'Sofia Martinez',
      left_at: null,
    })
    expect(mapEventJoinerResponses([joinerResponse])).toEqual([
      mapEventJoinerResponse(joinerResponse),
    ])
  })

  it('maps batch joiner info responses to the frontend joiner model', () => {
    const joinerInfoResponse: EventJoinerInfoResponse = {
      event_id: 10,
      user_id: 7,
      user_name: 'Sofia Martinez',
    }

    expect(mapEventJoinerInfoResponse(joinerInfoResponse)).toEqual({
      id: null,
      event_id: 10,
      user_id: 7,
      user_name: 'Sofia Martinez',
      left_at: null,
    })
    expect(mapEventJoinerInfoResponses([joinerInfoResponse])).toEqual([
      mapEventJoinerInfoResponse(joinerInfoResponse),
    ])
  })

  it('groups joiners by event id and keeps empty arrays for requested events', () => {
    expect(
      groupJoinersByEventId(
        [10, 11],
        [
          {
            id: null,
            event_id: 10,
            user_id: 7,
            user_name: 'Sofia Martinez',
            left_at: null,
          },
          {
            id: null,
            event_id: 12,
            user_id: 8,
            user_name: 'Darwin',
            left_at: null,
          },
        ],
      ),
    ).toEqual({
      10: [
        {
          id: null,
          event_id: 10,
          user_id: 7,
          user_name: 'Sofia Martinez',
          left_at: null,
        },
      ],
      11: [],
      12: [
        {
          id: null,
          event_id: 12,
          user_id: 8,
          user_name: 'Darwin',
          left_at: null,
        },
      ],
    })
  })
})
