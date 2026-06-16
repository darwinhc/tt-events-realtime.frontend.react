import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {CreateEventDialog} from '@/domains/events/components/CreateEventDialog'
import {currentUser} from '@/test/fixtures'

describe('CreateEventDialog', () => {
  it('renders nothing while closed', () => {
    const {container} = render(
      <CreateEventDialog
        currentUser={currentUser}
        error={null}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        open={false}
        saving={false}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('submits typed event data and closes from both controls', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const onClose = vi.fn()
    render(
      <CreateEventDialog
        currentUser={currentUser}
        error="Example error"
        onClose={onClose}
        onCreate={onCreate}
        open
        saving={false}
      />,
    )

    expect(screen.getByText('Example error')).toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', {name: 'Event title'}),
      'Community Dinner',
    )
    await user.type(
      screen.getByLabelText('Date and time'),
      '2026-08-15T19:00',
    )
    await user.clear(screen.getByRole('spinbutton', {name: 'Duration in hours'}))
    await user.type(
      screen.getByRole('spinbutton', {name: 'Duration in hours'}),
      '2',
    )
    await user.type(screen.getByRole('textbox', {name: 'Venue'}), 'Garden Hall')
    await user.selectOptions(screen.getByRole('combobox', {name: 'Country'}), 'DE')
    await user.type(
      screen.getByRole('textbox', {name: 'City'}),
      'Any custom city',
    )
    await user.type(
      screen.getByRole('textbox', {name: 'Address'}),
      'Garden Street 10',
    )
    await user.type(
      screen.getByRole('textbox', {name: 'Postal code'}),
      '10115',
    )
    await user.click(screen.getByRole('button', {name: 'Create event'}))

    expect(onCreate).toHaveBeenCalledWith({
      title: 'Community Dinner',
      scheduled_at: new Date('2026-08-15T19:00').toISOString(),
      duration_in_minutes: 120,
      location: {
        name: 'Garden Hall',
        address: 'Garden Street 10',
        country: 'DE',
        city: 'Any custom city',
        postal_code: '10115',
      },
    })

    await user.click(screen.getByRole('button', {name: 'Cancel'}))
    await user.click(screen.getByRole('button', {name: 'Close'}))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('disables actions while saving', () => {
    render(
      <CreateEventDialog
        currentUser={currentUser}
        error={null}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        open
        saving
      />,
    )
    expect(screen.getByRole('button', {name: 'Close'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'Cancel'})).toBeDisabled()
    expect(screen.getByRole('button', {name: 'Create event'})).toBeDisabled()
  })
})
