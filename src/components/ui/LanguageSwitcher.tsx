import {Languages} from 'lucide-react'
import {useTranslation} from 'react-i18next'

export function LanguageSwitcher() {
    const {i18n} = useTranslation()

    function changeLanguage(language: 'en' | 'de') {
        void i18n.changeLanguage(language)
        window.localStorage.setItem('events.language', language)
    }

    return (
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1">
      <span className="grid size-7 place-items-center text-white/35">
        <Languages className="size-3.5"/>
      </span>

            <button
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                    i18n.language === 'en'
                        ? 'bg-lime-300 text-zinc-950'
                        : 'text-white/40 hover:text-white'
                }`}
                onClick={() => changeLanguage('en')}
                type="button"
            >
                EN
            </button>

            <button
                className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                    i18n.language === 'de'
                        ? 'bg-lime-300 text-zinc-950'
                        : 'text-white/40 hover:text-white'
                }`}
                onClick={() => changeLanguage('de')}
                type="button"
            >
                DE
            </button>
        </div>
    )
}