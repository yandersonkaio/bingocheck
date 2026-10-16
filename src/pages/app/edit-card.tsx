import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { db } from '@/lib/database'
import { NewCard } from '@/pages/app/new-card'

export function EditCard() {
  const { id } = useParams()
  const { t } = useTranslation()

  const card = useLiveQuery(
    () => (id ? db.cards.get(id).then((result) => result ?? null) : null),
    [id],
  )

  if (card === undefined) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        {t('cards.loading')}
      </div>
    )
  }

  if (card === null) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center">
        <p>{t('cards.edit.notFound')}</p>

        <Link to="/cards" className="text-primary text-sm font-medium">
          {t('cards.new.back')}
        </Link>
      </div>
    )
  }

  return <NewCard key={card.id} initialCard={card} />
}
