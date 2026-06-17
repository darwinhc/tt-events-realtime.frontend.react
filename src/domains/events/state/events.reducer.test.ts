import {describe, expect, it} from 'vitest'

import {eventsReducer} from '@/domains/events/state/events.reducer'
import {initialEventsState} from '@/domains/events/state/events.state'
import type {EventJoiner} from '@/domains/events/types/event.types.ts'
import {activeEvent, canceledEvent, currentUser, joiner} from '@/test/fixtures.ts'

const baseState = {
  ...initialEventsState,
  events: [activeEvent, canceledEvent],
  selectedId: activeEvent.id,
  joinersByEvent: {
    [activeEvent.id]: [joiner],
  },
  loading: false,
}

describe('eventsReducer', () => {
  it('stores loaded events and keeps the preferred selected event when it exists', () => {
    const state = eventsReducer(initialEventsState, {
      type: 'eventsLoaded',
      payload: {
        events: [activeEvent, canceledEvent],
        preferredId: canceledEvent.id,
      },
    })

    expect(state.events).toEqual([activeEvent, canceledEvent])
    expect(state.selectedId).toBe(canceledEvent.id)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('falls back to the first event when the preferred selected event does not exist', () => {
    const state = eventsReducer(initialEventsState, {
      type: 'eventsLoaded',
      payload: {
        events: [activeEvent],
        preferredId: 999,
      },
    })

    expect(state.selectedId).toBe(activeEvent.id)
  })

  it('clears joiners when there are no loaded events', () => {
    const state = eventsReducer(baseState, {
      type: 'eventsLoaded',
      payload: {
        events: [],
      },
    })

    expect(state.events).toEqual([])
    expect(state.selectedId).toBeNull()
    expect(state.joinersByEvent).toEqual({})
  })

  it('stores a load failure without losing the current events', () => {
    const state = eventsReducer(baseState, {
      type: 'eventsLoadFailed',
      payload: {
        error: 'Backend unavailable.',
      },
    })

    expect(state.events).toEqual(baseState.events)
    expect(state.loading).toBe(false)
    expect(state.error).toBe('Backend unavailable.')
  })

  it('stores joiners for one event', () => {
    const nextJoiner: EventJoiner = {
      id: 11,
      event_id: canceledEvent.id,
      user_id: 9,
      user_name: 'Mina Lee',
      left_at: null,
    }

    const state = eventsReducer(baseState, {
      type: 'joinersLoaded',
      payload: {
        eventId: canceledEvent.id,
        joiners: [nextJoiner],
      },
    })

    expect(state.joinersByEvent[canceledEvent.id]).toEqual([nextJoiner])
    expect(state.joinersByEvent[activeEvent.id]).toEqual([joiner])
  })

  it('merges batch joiners without removing previously loaded event joiners', () => {
    const batchJoiner: EventJoiner = {
      id: null,
      event_id: canceledEvent.id,
      user_id: 12,
      user_name: 'Batch User',
      left_at: null,
    }

    const state = eventsReducer(baseState, {
      type: 'joinersBatchLoaded',
      payload: {
        joinersByEvent: {
          [canceledEvent.id]: [batchJoiner],
        },
      },
    })

    expect(state.joinersByEvent[activeEvent.id]).toEqual([joiner])
    expect(state.joinersByEvent[canceledEvent.id]).toEqual([batchJoiner])
  })

  it('adds a joiner and increases the event joiners count only once', () => {
    const newJoiner: EventJoiner = {
      id: 12,
      event_id: activeEvent.id,
      user_id: 99,
      user_name: 'New User',
      left_at: null,
    }

    const state = eventsReducer(baseState, {
      type: 'eventJoinerAdded',
      payload: {
        eventId: activeEvent.id,
        joiner: newJoiner,
      },
    })

    expect(state.joinersByEvent[activeEvent.id]).toEqual([joiner, newJoiner])
    expect(state.events[0].joiners_count).toBe(activeEvent.joiners_count + 1)

    const unchangedState = eventsReducer(state, {
      type: 'eventJoinerAdded',
      payload: {
        eventId: activeEvent.id,
        joiner: newJoiner,
      },
    })

    expect(unchangedState.joinersByEvent[activeEvent.id]).toEqual([
      joiner,
      newJoiner,
    ])
    expect(unchangedState.events[0].joiners_count).toBe(
      activeEvent.joiners_count + 1,
    )
  })

  it('removes a joiner and decreases the event joiners count', () => {
    const state = eventsReducer(baseState, {
      type: 'eventJoinerRemoved',
      payload: {
        eventId: activeEvent.id,
        userName: currentUser.name,
      },
    })

    expect(state.joinersByEvent[activeEvent.id]).toEqual([])
    expect(state.events[0].joiners_count).toBe(activeEvent.joiners_count - 1)
  })

  it('updates live connection state', () => {
    const state = eventsReducer(baseState, {
      type: 'liveChanged',
      payload: {
        live: true,
      },
    })

    expect(state.live).toBe(true)
  })
})
