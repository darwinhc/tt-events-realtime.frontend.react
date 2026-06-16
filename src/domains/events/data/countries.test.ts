import {describe, expect, it} from 'vitest'

import {countryOptions, getCountryName,} from '@/domains/events/data/countries'

describe('countryOptions', () => {
  it('provides sorted ISO alpha-2 country options locally', () => {
    expect(countryOptions.length).toBeGreaterThan(200)
    expect(countryOptions.slice(0, 4).map(({code}) => code)).toEqual([
      'DE',
      'NL',
      'ES',
      'CO',
    ])
    expect(countryOptions).toContainEqual({code: 'DE', name: 'Germany'})
    expect(countryOptions).toContainEqual({code: 'US', name: 'United States of America'})
    expect(countryOptions.every(({code}) => /^[A-Z]{2}$/.test(code))).toBe(true)
    expect(getCountryName('de')).toBe('Germany')
    expect(getCountryName(null)).toBeNull()
    const remainingCountryNames = countryOptions
      .slice(4)
      .map(({name}) => name)
    expect(remainingCountryNames).toEqual(
      [...remainingCountryNames].sort((first, second) =>
        first.localeCompare(second),
      ),
    )
  })
})
