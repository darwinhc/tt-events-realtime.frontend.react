import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest'

import { EventsScreen } from '@/domains/events/components/EventsScreen'
import type {
  CreateEventInput,
  EventDetails,
} from '@/domains/events/types/event.types'
import { eventsService } from '@/services/events/events.service'
import {
  activeEvent,
  canceledEvent,
  currentUser,
  joiner,
} from '@/test/fixtures'

vi.mock('@/services/events/events.service', () => ({
  eventsService: {
    cancel: vi.fn(),
    create: vi.fn(),
    getEvents: vi.fn(),
    getJoiners: vi.fn(),
    getWebSocketUrl: vi.fn(() => 'ws://localhost/ws/events'),
    join: vi.fn(),
    leave: vi.fn(),
    uncancel: vi.fn(),
    update: vi.fn(),
    updateLocation: vi.fn(),
  },
}))

const serviceMocks = eventsService as Mocked<typeof eventsService>

class MockWebSocket {
  static instances: MockWebSocket[] = []

  readonly url: string
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  close = vi.fn()

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }
}

async function enterUser(name = currentUser.name) {
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox', { name: 'Your name' }), name)
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  )
}

async function renderLoadedScreen(events: EventDetails[] = [activeEvent]) {
  serviceMocks.getEvents.mockResolvedValue(events)
  serviceMocks.getJoiners.mockResolvedValue([])
  render(<EventsScreen />)
  if (events.length > 0) {
    await waitFor(() =>
      expect(screen.getAllByText(events[0].title)).toHaveLength(2),
    )
  } else {
    await screen.findByText('No events yet')
  }
}

describe('EventsScreen', () => {
  beforeEach(() => {
    Object.values(serviceMocks).forEach((mock) => mock.mockClear())
    serviceMocks.getWebSocketUrl.mockReturnValue('ws://localhost/ws/events')
    MockWebSocket.instances = []
    Object.defineProperty(globalThis, 'WebSocket', {
      configurable: true,
      value: MockWebSocket,
      writable: true,
    })
  })

  it('stores only the user name for the current tab', async () => {
    const user = userEvent.setup()
    await renderLoadedScreen()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText(activeEvent.title)).toHaveLength(2)

    await user.type(
      screen.getByRole('textbox', { name: 'Your name' }),
      'Sofia Martinez',
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Sofia Martinez')).toBeInTheDocument()
    expect(window.localStorage).toHaveLength(0)
    expect(
      JSON.parse(
        window.sessionStorage.getItem('events.current-user.v1') ?? '{}',
      ),
    ).toEqual({ name: 'Sofia Martinez' })
  })

  it('restores the tab user and clears it when changing user', async () => {
    const user = userEvent.setup()
    window.sessionStorage.setItem(
      'events.current-user.v1',
      JSON.stringify({ name: currentUser.name }),
    )
    await renderLoadedScreen()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(currentUser.name)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change user' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      window.sessionStorage.getItem('events.current-user.v1'),
    ).toBeNull()
  })

  it('ignores and removes an invalid tab user', async () => {
    window.sessionStorage.setItem('events.current-user.v1', '{broken')
    await renderLoadedScreen()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      window.sessionStorage.getItem('events.current-user.v1'),
    ).toBeNull()
  })

  it('creates an event and selects the created record', async () => {
    const user = userEvent.setup()
    const createdEvent = {
      ...activeEvent,
      id: 3,
      title: 'Community Dinner',
      organizer: currentUser.name,
    }
    serviceMocks.getEvents
      .mockResolvedValueOnce([activeEvent])
      .mockResolvedValue([activeEvent, createdEvent])
    serviceMocks.getJoiners.mockResolvedValue([])
    serviceMocks.create.mockResolvedValue(createdEvent)

    render(<EventsScreen />)
    await waitFor(() =>
      expect(screen.getAllByText(activeEvent.title)).toHaveLength(2),
    )
    await enterUser()
    await user.click(
      screen.getByRole('button', { name: /^Create event/ }),
    )

    await user.type(
      screen.getByRole('textbox', { name: 'Event title' }),
      'Community Dinner',
    )
    await user.type(
      screen.getByLabelText('Date and time'),
      '2026-08-15T19:00',
    )
    await user.type(screen.getByRole('textbox', { name: 'Venue' }), 'Garden Hall')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'DE')
    await user.type(screen.getByRole('textbox', { name: 'City' }), 'Berlin')
    await user.type(
      screen.getByRole('textbox', { name: 'Address' }),
      'Garden Street 10',
    )
    await user.click(
      screen.getByRole('dialog').querySelector('button[type="submit"]')!,
    )

    await waitFor(() => expect(serviceMocks.create).toHaveBeenCalledTimes(1))
    const input = serviceMocks.create.mock.calls[0][0] as CreateEventInput
    expect(input).toMatchObject({
      title: 'Community Dinner',
      location: {
        name: 'Garden Hall',
        address: 'Garden Street 10',
        country: 'DE',
        city: 'Berlin',
      },
    })
    expect(serviceMocks.create).toHaveBeenCalledWith(
      expect.any(Object),
      currentUser.name,
    )
    await waitFor(() =>
      expect(
        screen.getAllByRole('heading', { name: 'Community Dinner' }),
      ).toHaveLength(2),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('joins and leaves the selected event', async () => {
    const user = userEvent.setup()
    serviceMocks.getEvents.mockResolvedValue([activeEvent])
    serviceMocks.getJoiners
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([joiner])
      .mockResolvedValue([])
    serviceMocks.join.mockResolvedValue(joiner)
    serviceMocks.leave.mockResolvedValue(joiner)

    render(<EventsScreen />)
    await enterUser()
    const eventCallsBeforeJoining = serviceMocks.getEvents.mock.calls.length
    await user.click(await screen.findByRole('button', { name: 'Join event' }))
    expect(serviceMocks.join).toHaveBeenCalledWith(1, 'Sofia Martinez')

    await user.click(await screen.findByRole('button', { name: 'Leave event' }))
    expect(serviceMocks.leave).toHaveBeenCalledWith(1, 'Sofia Martinez')
    expect(serviceMocks.getEvents).toHaveBeenCalledTimes(
      eventCallsBeforeJoining,
    )
  })

  it('cancels an event owned by the current user', async () => {
    const user = userEvent.setup()
    const ownedEvent = { ...activeEvent, organizer: currentUser.name }
    serviceMocks.getEvents.mockResolvedValue([ownedEvent])
    serviceMocks.getJoiners.mockResolvedValue([])
    serviceMocks.cancel.mockResolvedValue(ownedEvent)

    render(<EventsScreen />)
    await enterUser()
    await user.click(
      await screen.findByRole('button', { name: 'Cancel event' }),
    )
    expect(serviceMocks.cancel).toHaveBeenCalledWith(
      ownedEvent.id,
      currentUser.name,
    )
  })

  it('restores a canceled event owned by the current user', async () => {
    const user = userEvent.setup()
    const ownedEvent = {
      ...activeEvent,
      organizer: currentUser.name,
      status: 'canceled' as const,
      canceled_at: '2026-06-12T12:00:00Z',
    }
    serviceMocks.getEvents.mockResolvedValue([ownedEvent])
    serviceMocks.getJoiners.mockResolvedValue([])
    serviceMocks.uncancel.mockResolvedValue({
      ...ownedEvent,
      status: 'active',
      canceled_at: null,
    })

    render(<EventsScreen />)
    await enterUser()
    await user.click(
      await screen.findByRole('button', { name: 'Restore event' }),
    )
    expect(serviceMocks.uncancel).toHaveBeenCalledWith(
      ownedEvent.id,
      currentUser.name,
    )
  })

  it('updates an event owned by the current user', async () => {
    const user = userEvent.setup()
    const ownedEvent = { ...activeEvent, organizer: currentUser.name }
    serviceMocks.getEvents.mockResolvedValue([ownedEvent])
    serviceMocks.getJoiners.mockResolvedValue([])
    serviceMocks.update.mockResolvedValue(ownedEvent)
    serviceMocks.updateLocation.mockResolvedValue(ownedEvent.location)

    render(<EventsScreen />)
    await enterUser()
    await user.click(
      await screen.findByRole('button', { name: 'Edit event' }),
    )
    const title = screen.getByRole('textbox', { name: 'Event title' })
    await user.clear(title)
    await user.type(title, 'Updated event title')
    const venue = screen.getByRole('textbox', { name: 'Venue' })
    await user.clear(venue)
    await user.type(venue, 'Updated venue')
    const address = screen.getByRole('textbox', { name: 'Address' })
    await user.clear(address)
    await user.type(address, 'New Street 42')
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Country' }),
      'CO',
    )
    const city = screen.getByRole('textbox', { name: 'City' })
    await user.clear(city)
    await user.type(city, 'Bogota')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(serviceMocks.updateLocation).toHaveBeenCalledOnce(),
    )
    expect(serviceMocks.updateLocation).toHaveBeenCalledWith(
      ownedEvent.location_id,
      {
        name: 'Updated venue',
        address: 'New Street 42',
        country: 'CO',
        city: 'Bogota',
        postal_code: ownedEvent.location.postal_code,
      },
      currentUser.name,
    )
    await waitFor(() => expect(serviceMocks.update).toHaveBeenCalledOnce())
    expect(serviceMocks.update).toHaveBeenCalledWith(
      ownedEvent.id,
      expect.objectContaining({
        title: 'Updated event title',
        duration_in_minutes: ownedEvent.duration_in_minutes,
      }),
      currentUser.name,
    )
  })

  it('shows the active filter only when inactive events exist', async () => {
    const user = userEvent.setup()
    const completedEvent = {
      ...activeEvent,
      id: 4,
      title: 'Finished workshop',
      scheduled_at: '2020-01-01T10:00:00Z',
    }
    await renderLoadedScreen([activeEvent, completedEvent])

    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.queryByText('Finished workshop')).not.toBeInTheDocument()
    expect(screen.getAllByText(activeEvent.title)).toHaveLength(2)
  })

  it('filters joined events independently, including canceled events', async () => {
    const user = userEvent.setup()
    const canceledJoiner = {
      ...joiner,
      event_id: canceledEvent.id,
    }
    serviceMocks.getEvents.mockResolvedValue([activeEvent, canceledEvent])
    serviceMocks.getJoiners.mockImplementation(async (eventId) =>
      eventId === canceledEvent.id ? [canceledJoiner] : [],
    )

    render(<EventsScreen />)
    await waitFor(() =>
      expect(screen.getAllByText(activeEvent.title)).toHaveLength(2),
    )
    await enterUser()
    await waitFor(() =>
      expect(screen.getAllByText('Joined')).toHaveLength(2),
    )

    await user.click(screen.getByRole('button', { name: 'Joined' }))

    await waitFor(() =>
      expect(screen.queryByText(activeEvent.title)).not.toBeInTheDocument(),
    )
    expect(screen.getAllByText(canceledEvent.title)).toHaveLength(2)
    expect(screen.getAllByText('Canceled')).toHaveLength(2)
  })

  it('caches joiners and keeps one WebSocket while changing selection', async () => {
    const user = userEvent.setup()
    serviceMocks.getEvents.mockResolvedValue([activeEvent, canceledEvent])
    serviceMocks.getJoiners.mockResolvedValue([])

    render(<EventsScreen />)
    await waitFor(() =>
      expect(screen.getAllByText(activeEvent.title)).toHaveLength(2),
    )
    await waitFor(() =>
      expect(serviceMocks.getJoiners).toHaveBeenCalledWith(activeEvent.id),
    )
    await enterUser()
    await waitFor(() =>
      expect(serviceMocks.getJoiners).toHaveBeenCalledWith(canceledEvent.id),
    )
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))

    await user.click(
      screen.getByRole('button', { name: /Canceled Gathering/ }),
    )

    expect(MockWebSocket.instances).toHaveLength(1)
    expect(
      serviceMocks.getJoiners.mock.calls.filter(
        ([eventId]) => eventId === activeEvent.id,
      ),
    ).toHaveLength(1)
    expect(
      serviceMocks.getJoiners.mock.calls.filter(
        ([eventId]) => eventId === canceledEvent.id,
      ),
    ).toHaveLength(1)
  })

  it('shows a load error and retries', async () => {
    const user = userEvent.setup()
    serviceMocks.getEvents
      .mockRejectedValueOnce(new Error('Service unavailable'))
      .mockResolvedValueOnce([])
    serviceMocks.getJoiners.mockResolvedValue([])

    render(<EventsScreen />)
    expect(await screen.findByText('Unable to load events')).toBeInTheDocument()
    expect(screen.getByText('Service unavailable')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('No events yet')).toBeInTheDocument()
  })

  it('updates live status and reloads after a WebSocket message', async () => {
    await renderLoadedScreen()
    await enterUser()

    await waitFor(() =>
      expect(MockWebSocket.instances.length).toBeGreaterThan(0),
    )
    const socket = MockWebSocket.instances.at(-1)!
    expect(socket.url).toBe('ws://localhost/ws/events')

    act(() => socket.onopen?.())
    expect(await screen.findByText('Live sync')).toBeInTheDocument()

    const callsBeforeMessage = serviceMocks.getEvents.mock.calls.length
    act(() =>
      socket.onmessage?.({
        data: JSON.stringify({
          event_id: activeEvent.id,
          type: 'event.updated',
          payload: {
            title: 'Updated over WebSocket',
            duration_in_minutes: 90,
            scheduled_at: null,
            status: 'canceled',
            canceled_at: '2026-06-14T12:00:00Z',
            deletion_scheduled_at: '2026-06-21T12:00:00Z',
          },
        }),
      }),
    )
    expect(
      await screen.findAllByRole('heading', {
        name: 'Updated over WebSocket',
      }),
    ).toHaveLength(2)
    expect(serviceMocks.getEvents).toHaveBeenCalledTimes(
      callsBeforeMessage,
    )

    act(() => socket.onclose?.())
    expect(await screen.findByText('Connecting')).toBeInTheDocument()
  })

  it('applies joiner and location notifications without global reloads', async () => {
    await renderLoadedScreen()
    await enterUser()
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const socket = MockWebSocket.instances[0]
    const eventCallsBeforeMessages = serviceMocks.getEvents.mock.calls.length

    act(() =>
      socket.onmessage?.({
        data: JSON.stringify({
          event_id: activeEvent.id,
          type: 'joiner.joined',
          payload: {
            joiner,
            joiners_count: 2,
          },
        }),
      }),
    )

    expect(await screen.findByText('2 people joining')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Leave event' })).toBeEnabled()

    act(() =>
      socket.onmessage?.({
        data: JSON.stringify({
          location_id: activeEvent.location_id,
          type: 'location.updated',
          payload: {
            name: 'Updated realtime venue',
            address: 'Realtime Street 1',
          },
        }),
      }),
    )

    expect(
      await screen.findAllByText('Updated realtime venue'),
    ).toHaveLength(2)
    expect(serviceMocks.getEvents).toHaveBeenCalledTimes(
      eventCallsBeforeMessages,
    )

    act(() =>
      socket.onmessage?.({
        data: JSON.stringify({
          event_id: activeEvent.id,
          type: 'joiner.left',
          payload: {
            joiner: { ...joiner, left_at: '2026-06-14T12:30:00Z' },
            joiners_count: 1,
          },
        }),
      }),
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Join event' })).toBeEnabled(),
    )
  })

  it('falls back to API reads for incomplete or unknown notifications', async () => {
    await renderLoadedScreen()
    await enterUser()
    await waitFor(() => expect(MockWebSocket.instances).toHaveLength(1))
    const socket = MockWebSocket.instances[0]
    const joinerCalls = serviceMocks.getJoiners.mock.calls.length
    const eventCalls = serviceMocks.getEvents.mock.calls.length

    act(() =>
      socket.onmessage?.({
        data: JSON.stringify({
          event_id: activeEvent.id,
          type: 'joiner.joined',
          payload: {},
        }),
      }),
    )
    await waitFor(() =>
      expect(serviceMocks.getJoiners.mock.calls.length).toBeGreaterThan(
        joinerCalls,
      ),
    )

    act(() => socket.onmessage?.({ data: 'not-json' }))
    await waitFor(() =>
      expect(serviceMocks.getEvents.mock.calls.length).toBeGreaterThan(
        eventCalls,
      ),
    )
  })
})
