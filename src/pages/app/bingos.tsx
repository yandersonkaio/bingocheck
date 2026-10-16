import { Plus, Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function Bingos() {
  const { t } = useTranslation()

  const bingos: unknown[] = []

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('bingos.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {t('bingos.description')}
          </p>
        </div>

        <Link
          to="/bingos/new"
          className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          <span>{t('bingos.newBingo')}</span>
        </Link>
      </div>

      {bingos.length === 0 && (
        <section className="bg-card border-border flex flex-col items-center gap-4 rounded-xl border px-5 py-10 text-center">
          <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
            <Ticket className="text-primary size-7" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t('bingos.empty.title')}</h2>

            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              {t('bingos.empty.description')}
            </p>
          </div>

          <Link
            to="/bingos/new"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t('bingos.empty.createBingo')}
          </Link>
        </section>
      )}
    </div>
  )
}
