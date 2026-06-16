import { describe, expect, it } from 'vitest'

import { cn } from '@/lib/cn'

describe('cn', () => {
  it('combines conditional classes and resolves Tailwind conflicts', () => {
    const isHidden = false
    expect(cn('px-2', isHidden ? 'hidden' : undefined, 'px-4')).toBe('px-4')
  })
})
