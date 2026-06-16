import {Info} from 'lucide-react'
import {useTranslation} from 'react-i18next'

export function DemoDataNotice() {
  const {t} = useTranslation()

  return (
    <div className="border-b border-amber-300/10 bg-amber-300/6">
      <div className="mx-auto flex max-w-350 items-start gap-3 px-5 py-3 text-amber-100 sm:items-center">
        <span
          className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-amber-300/10 text-amber-300 sm:mt-0">
          <Info className="size-3.5"/>
        </span>

        <p className="text-xs leading-5 text-amber-100/80">
          <strong className="font-extrabold text-amber-100">
            {t('common.technicalDemo')}:
          </strong>{' '}
          {t('common.demoNotice')}
        </p>
      </div>
    </div>
  )
}
