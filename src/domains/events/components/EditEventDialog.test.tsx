import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EditEventDialog } from '@/domains/events/components/EditEventDialog'
import { activeEvent, canceledEvent } from '@/test/fixtures'

const baseProps = {
  error: null,
  event: activeEvent,
  onClose: vi.fn(),
  onUpdate: vi.fn(),
  open: true,
  saving: false,
}

describe('EditEventDialog', () => {
  it('does not render while closed', () => {
    render(<EditEventDialog {...baseProps} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('updates event details and the current location', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<EditEventDialog {...baseProps} onUpdate={onUpdate} />)

    expect(screen.getByRole('textbox', { name: 'Venue' })).toHaveValue(
      activeEvent.location.name,
    )
    expect(screen.getByRole('textbox', { name: 'Address' })).toHaveValue(
      activeEvent.location.address,
    )

    await user.clear(screen.getByRole('textbox', { name: 'Event title' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Event title' }),
      'Updated workshop',
    )
    await user.clear(screen.getByRole('textbox', { name: 'Venue' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Venue' }),
      'New venue',
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Country' }),
      'CO',
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onUpdate).toHaveBeenCalledWith({
      event: {
        title: 'Updated workshop',
        scheduled_at: '2026-07-09T16:30:00.000Z',
        duration_in_minutes: activeEvent.duration_in_minutes,
      },
      location: {
        name: 'New venue',
        address: activeEvent.location.address,
        country: 'CO',
        city: activeEvent.location.city,
        postal_code: activeEvent.location.postal_code,
      },
    })
  })

  it('requires a venue or address and supports nullable location fields', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(
      <EditEventDialog
        {...baseProps}
        event={canceledEvent}
        onUpdate={onUpdate}
      />,
    )

    const address = screen.getByRole('textbox', { name: 'Address' })
    await user.clear(address)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onUpdate).not.toHaveBeenCalled()

    await user.type(
      screen.getByRole('textbox', { name: 'Venue' }),
      'Online room',
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onUpdate).toHaveBeenCalledWith({
      event: {
        title: canceledEvent.title,
        scheduled_at: null,
        duration_in_minutes: canceledEvent.duration_in_minutes,
      },
      location: {
        name: 'Online room',
        address: null,
        country: null,
        city: null,
        postal_code: null,
      },
    })
  })

  it('shows errors, disables actions while saving, and closes when available', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(
      <EditEventDialog
        {...baseProps}
        error="Could not update location."
        onClose={onClose}
        saving
      />,
    )

    expect(screen.getByText('Could not update location.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    rerender(<EditEventDialog {...baseProps} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
