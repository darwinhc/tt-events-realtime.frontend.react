import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import App from '@/app/App'

vi.mock('@/domains/events/components/EventsScreen', () => ({
    EventsScreen: () => <div>Events screen</div>,
}))

describe('App', () => {
    it('renders the single events screen', () => {
        render(<App/>)
        expect(screen.getByText('Events screen')).toBeInTheDocument()
    })
})
