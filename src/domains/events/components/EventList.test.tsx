import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {EventList} from '@/domains/events/components/EventList'
import {activeEvent, canceledEvent} from '@/test/fixtures'

describe('EventList', () => {
    const now = new Date('2026-06-14T12:00:00Z').getTime()
    const noJoinedEvents = new Set<number>()

    it('renders its empty state', () => {
        render(
            <EventList
                events={[]}
                joinedEventIds={noJoinedEvents}
                now={now}
                onSelect={vi.fn()}
                selectedId={null}
            />,
        )
        expect(screen.getByText('No events yet')).toBeInTheDocument()
    })

    it('renders active and canceled events and selects one', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()
        render(
            <EventList
                events={[activeEvent, canceledEvent]}
                joinedEventIds={new Set([canceledEvent.id])}
                now={now}
                onSelect={onSelect}
                selectedId={activeEvent.id}
            />,
        )

        expect(screen.getByText('Realtime Product Salon')).toBeInTheDocument()
        expect(screen.getByText('Canceled')).toBeInTheDocument()
        expect(screen.getByText('Joined')).toBeInTheDocument()
        expect(screen.getByText('1 person joining')).toBeInTheDocument()
        expect(screen.getByText('0 people joining')).toBeInTheDocument()
        expect(screen.getByText('Factory Berlin')).toBeInTheDocument()
        expect(screen.getByText('Lohmühlenstraße 65')).toBeInTheDocument()
        expect(screen.getByText('12435 Berlin, Germany')).toBeInTheDocument()
        expect(screen.getByText('Remote')).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', {name: /Canceled Gathering/}),
        )
        expect(onSelect).toHaveBeenCalledWith(canceledEvent.id)
    })

    it('labels an event after its duration has elapsed', () => {
        render(
            <EventList
                events={[
                    {
                        ...activeEvent,
                        scheduled_at: '2026-06-14T08:00:00Z',
                        duration_in_minutes: 60,
                    },
                ]}
                joinedEventIds={noJoinedEvents}
                now={now}
                onSelect={vi.fn()}
                selectedId={activeEvent.id}
            />,
        )

        expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('labels an event while its scheduled duration is running', () => {
        render(
            <EventList
                events={[
                    {
                        ...activeEvent,
                        scheduled_at: '2026-06-14T11:00:00Z',
                        duration_in_minutes: 120,
                    },
                ]}
                joinedEventIds={noJoinedEvents}
                now={now}
                onSelect={vi.fn()}
                selectedId={activeEvent.id}
            />,
        )

        expect(screen.getByText('In progress')).toBeInTheDocument()
        expect(screen.getByText(activeEvent.title)).not.toHaveClass('line-through')
    })
})
