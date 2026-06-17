import {eventsApi} from '@/domains/events/api/events-api.ts'
import {
  mapCreatedEventResponse,
  mapEventDetailsResponses,
  mapEventJoinerInfoResponses,
  mapEventJoinerResponse,
  mapEventJoinerResponses,
  mapEventLocationResponse,
} from '@/domains/events/mappers/event.mapper.ts'
import type {CreateEventInput, UpdateEventInput, UpdateLocationInput,} from '@/domains/events/types/event.types.ts'

export const eventsService = {
  getEvents: async () => {
    const events = await eventsApi.getEvents()
    return mapEventDetailsResponses(events)
  },

  getJoiners: async (eventId: number) => {
    const joiners = await eventsApi.getJoiners(eventId)
    return mapEventJoinerResponses(joiners)
  },

  getJoinersForEvents: async (eventIds: number[]) => {
    const joiners = await eventsApi.getJoinersForEvents(eventIds)
    return mapEventJoinerInfoResponses(joiners)
  },

  join: async (eventId: number, userName: string) => {
    const joiner = await eventsApi.join(eventId, userName)
    return mapEventJoinerResponse(joiner)
  },

  leave: async (eventId: number, userName: string) => {
    const joiner = await eventsApi.leave(eventId, userName)
    return mapEventJoinerResponse(joiner)
  },

  cancel: async (eventId: number, userName: string) => {
    const event = await eventsApi.cancel(eventId, userName)
    return mapCreatedEventResponse(event)
  },

  uncancel: async (eventId: number, userName: string) => {
    const event = await eventsApi.uncancel(eventId, userName)
    return mapCreatedEventResponse(event)
  },

  update: async (
    eventId: number,
    input: UpdateEventInput,
    userName: string,
  ) => {
    const event = await eventsApi.update(eventId, input, userName)
    return mapCreatedEventResponse(event)
  },

  updateLocation: async (
    locationId: number,
    input: UpdateLocationInput,
    userName: string,
  ) => {
    const location = await eventsApi.updateLocation(locationId, input, userName)
    return mapEventLocationResponse(location)
  },

  create: async (input: CreateEventInput, userName: string) => {
    const event = await eventsApi.create(input, userName)
    return mapCreatedEventResponse(event)
  },

  getWebSocketUrl: eventsApi.getWebSocketUrl,
}