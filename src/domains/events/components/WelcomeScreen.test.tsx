import {fireEvent, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {WelcomeScreen} from '@/domains/events/components/WelcomeScreen'

describe('WelcomeScreen', () => {
  it('normalizes the name and creates the local identity', async () => {
    const user = userEvent.setup()
    const onCreateUser = vi.fn()
    render(<WelcomeScreen onCreateUser={onCreateUser}/>)

    const submit = screen.getByRole('button', {name: 'Continue'})
    expect(submit).toBeDisabled()

    await user.type(
      screen.getByRole('textbox', {name: 'Your name'}),
      '  Sofia   Martinez  ',
    )
    await user.click(submit)

    expect(onCreateUser).toHaveBeenCalledWith('Sofia Martinez')
  })

  it('does not create an identity from an empty name', () => {
    const onCreateUser = vi.fn()
    render(<WelcomeScreen onCreateUser={onCreateUser}/>)

    const input = screen.getByRole('textbox', {name: 'Your name'})
    fireEvent.submit(input.closest('form')!)

    expect(onCreateUser).not.toHaveBeenCalled()
  })
})
