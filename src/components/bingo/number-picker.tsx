import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

import { NumberOptions } from './number-options'

interface NumberPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columnIndex: number
  currentNumber: number | null
  usedNumbers: number[]
  onSelect: (number: number) => void
  onRemove: () => void
}

const columns = ['B', 'I', 'N', 'G', 'O']

export function NumberPicker({
  open,
  onOpenChange,
  columnIndex,
  currentNumber,
  usedNumbers,
  onSelect,
  onRemove,
}: NumberPickerProps) {
  const { t } = useTranslation()

  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')

    function handleChange(event: MediaQueryListEvent) {
      setIsDesktop(event.matches)
    }

    setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const column = columns[columnIndex]
  const min = columnIndex * 15 + 1
  const max = min + 14

  const title = t('cards.new.chooseNumber')
  const description = t('cards.new.columnRange', {
    column,
    min,
    max,
  })

  const columnStrip = (
    <div className="flex gap-1" aria-hidden>
      {columns.map((letter, idx) => (
        <div
          key={letter}
          className={`flex h-6 flex-1 items-center justify-center rounded text-[10px] font-bold tracking-wider transition-all ${
            idx === columnIndex
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground/60'
          }`}
        >
          {letter}
        </div>
      ))}
    </div>
  )

  const content = (
    <NumberOptions
      columnIndex={columnIndex}
      currentNumber={currentNumber}
      usedNumbers={usedNumbers}
      onSelect={onSelect}
      onRemove={onRemove}
    />
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {columnStrip}
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4">
            {columnStrip}
            {content}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
