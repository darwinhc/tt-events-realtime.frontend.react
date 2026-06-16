import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'

countries.registerLocale(en)

const PRIORITY_COUNTRY_CODES = ['DE', 'NL', 'ES', 'CO']

export interface CountryOption {
    code: string
    name: string
}

const alphabeticalCountryOptions: CountryOption[] = Object.entries(
    countries.getNames('en', {select: 'official'}),
)
    .map(([code, name]) => ({code, name}))
    .sort((first, second) => first.name.localeCompare(second.name))

export const countryOptions: CountryOption[] = [
    ...PRIORITY_COUNTRY_CODES.map((code) =>
        alphabeticalCountryOptions.find((country) => country.code === code),
    ).filter((country): country is CountryOption => Boolean(country)),
    ...alphabeticalCountryOptions.filter(
        (country) => !PRIORITY_COUNTRY_CODES.includes(country.code),
    ),
]

const countryNames = new Map(
    countryOptions.map(({code, name}) => [code, name]),
)

export function getCountryName(code: string | null) {
    if (!code) return null
    return countryNames.get(code.toUpperCase()) ?? code.toUpperCase()
}
