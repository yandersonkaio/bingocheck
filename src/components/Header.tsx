import { CheckCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { LanguageSelector } from './layout/LanguageSelector'
import { ThemeSelector } from './theme-selector'

export function Header() {
  const { t } = useTranslation()

  return (
    <header className="border-border border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-xl">
            <CheckCheck className="text-primary size-6" />
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="text-lg leading-tight font-semibold">
              BingoCheck
            </span>

            <span className="text-muted-foreground text-xs">
              {t('app.tagline')}
            </span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeSelector />
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
