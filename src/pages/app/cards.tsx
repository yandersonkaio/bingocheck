import { Grid3X3, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function Cards() {
  const { t } = useTranslation()

  const cards = []

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('cards.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {t('cards.description')}
          </p>
        </div>

        <Link
          to="/cards/new"
          className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          <span>{t('cards.newCard')}</span>
        </Link>
      </div>

      {cards.length === 0 && (
        <section className="bg-card border-border flex flex-col items-center gap-4 rounded-xl border px-5 py-10 text-center">
          <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
            <Grid3X3 className="text-primary size-7" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t('cards.empty.title')}</h2>

            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              {t('cards.empty.description')}
            </p>
          </div>

          <Link
            to="/cards/new"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t('cards.empty.addCard')}
          </Link>
        </section>
      )}
    </div>
  )
}
