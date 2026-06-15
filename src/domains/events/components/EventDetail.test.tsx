import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EventDetail } from '@/domains/events/components/EventDetail'
import {
  activeEvent,
  canceledEvent,
  currentUser,
  joiner,
} from '@/test/fixtures'

const baseProps = {
  busy: false,
  event: activeEvent,
  joiners: [],
  now: new Date('2026-06-14T12:00:00Z').getTime(),
  onCancel: vi.fn(),
  onEdit: vi.fn(),
  onJoinToggle: vi.fn(),
  onRestore: vi.fn(),
}

describe('EventDetail', () => {
  it('asks visitors to enter their name', () => {
    render(<EventDetail {...baseProps} currentUser={null} />)
    expect(
      screen.getByRole('button', { name: 'Enter your name to join' }),
    ).toBeDisabled()
    expect(screen.getByText('No one has joined yet.')).toBeInTheDocument()
    expect(screen.getByText('Factory Berlin')).toBeInTheDocument()
    expect(screen.getByText('Lohmühlenstraße 65')).toBeInTheDocument()
    expect(screen.getByText('12435 Berlin, Germany')).toBeInTheDocument()
    expect(screen.getByText('DE')).toBeInTheDocument()
  })

  it('lets an attendee join and leave', async () => {
    const user = userEvent.setup()
    const onJoinToggle = vi.fn()
    const { rerender } = render(
      <EventDetail
        {...baseProps}
        currentUser={currentUser}
        onJoinToggle={onJoinToggle}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Join event' }))
    expect(onJoinToggle).toHaveBeenCalledTimes(1)

    rerender(
      <EventDetail
        {...baseProps}
        currentUser={currentUser}
        joiners={[joiner]}
        onJoinToggle={onJoinToggle}
      />,
    )
    expect(screen.getByText('1 attendee')).toBeInTheDocument()
    expect(screen.getByText('Sofia Martinez')).toBeInTheDocument()
    expect(screen.getByText('Joined')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Leave event' }))
    expect(onJoinToggle).toHaveBeenCalledTimes(2)
  })

  it('lets the organizer cancel and shows busy state', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    const organizer = {
      id: activeEvent.organizer_id,
      name: activeEvent.organizer,
      initials: 'AM',
    }
    const { rerender } = render(
      <EventDetail
        {...baseProps}
        currentUser={organizer}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel event' }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    rerender(
      <EventDetail
        {...baseProps}
        busy
        currentUser={currentUser}
      />,
    )
    expect(screen.getByRole('button', { name: 'Join event' })).toBeDisabled()
  })

  it('renders canceled and unscheduled event details', () => {
    render(
      <EventDetail
        {...baseProps}
        currentUser={currentUser}
        event={canceledEvent}
      />,
    )
    expect(screen.getByText('Canceled')).toBeInTheDocument()
    expect(screen.getByText('Date to be defined')).toBeInTheDocument()
    expect(screen.getByText(/Time to be defined/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join event' })).toBeDisabled()
  })

  it('lets the organizer edit and restore a canceled event', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onRestore = vi.fn()
    const organizer = {
      id: canceledEvent.organizer_id,
      name: canceledEvent.organizer,
      initials: 'AM',
    }

    render(
      <EventDetail
        {...baseProps}
        currentUser={organizer}
        event={canceledEvent}
        onEdit={onEdit}
        onRestore={onRestore}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit event' }))
    await user.click(screen.getByRole('button', { name: 'Restore event' }))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onRestore).toHaveBeenCalledOnce()
  })

  it('marks finished events as completed and disables joining', () => {
    render(
      <EventDetail
        {...baseProps}
        currentUser={currentUser}
        event={{
          ...activeEvent,
          scheduled_at: '2026-06-14T08:00:00Z',
          duration_in_minutes: 60,
        }}
      />,
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Event completed' }),
    ).toBeDisabled()
  })

  it('marks an event as in progress between its start and end', () => {
    render(
      <EventDetail
        {...baseProps}
        currentUser={currentUser}
        event={{
          ...activeEvent,
          scheduled_at: '2026-06-14T11:00:00Z',
          duration_in_minutes: 120,
        }}
      />,
    )

    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join event' })).toBeEnabled()
  })
})
