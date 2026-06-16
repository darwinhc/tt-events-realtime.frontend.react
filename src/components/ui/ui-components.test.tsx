import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

describe('UI components', () => {
  it('renders button variants and card content', () => {
    render(
      <>
        <Button size="icon" variant="outline">
          Action
        </Button>
        <Card className="custom-card">
          <CardContent className="custom-content">Content</CardContent>
        </Card>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Action' })).toHaveClass('size-9')
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-card')
    expect(screen.getByText('Content')).toHaveClass('custom-content')
  })
})
