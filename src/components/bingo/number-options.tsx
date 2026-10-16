import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NumberOptionsProps {
  columnIndex: number
  currentNumber: number | null
  usedNumbers: number[]
  onSelect: (number: number) => void
  onRemove: () => void
}

export function NumberOptions({
  columnIndex,
  currentNumber,
  usedNumbers,
  onSelect,
  onRemove,
}: NumberOptionsProps) {
  const { t } = useTranslation()

  const options = Array.from(
    { length: 15 },
    (_, index) => columnIndex * 15 + index + 1,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-2">
        {options.map((number) => {
          const isUsed =
            usedNumbers.includes(number) && number !== currentNumber

          const isCurrent = number === currentNumber

          return (
            <button
              key={number}
              type="button"
              disabled={isUsed}
              onClick={() => onSelect(number)}
              className={`flex aspect-square items-center justify-center rounded-lg border text-base font-semibold transition-colors ${
                isCurrent
                  ? 'border-primary bg-primary/10 text-primary'
                  : isUsed
                    ? 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-40'
                    : 'border-border bg-background hover:border-primary hover:bg-primary/5'
              }`}
            >
              {number}
            </button>
          )
        })}
      </div>

      {currentNumber !== null && (
        <button
          type="button"
          onClick={onRemove}
          className="text-destructive border-border hover:bg-destructive/10 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <Trash2 className="size-4" />
          {t('cards.new.removeNumber')}
        </button>
      )}
    </div>
  )
}
