import { Check, Coffee, Flower2, Leaf, Moon, Palette, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { type Theme, useTheme } from '@/contexts/theme-context'

const themes = [
  { id: 'light', translationKey: 'settings.light', icon: Sun },
  { id: 'dark', translationKey: 'settings.dark', icon: Moon },
  { id: 'mocha', translationKey: 'settings.mocha', icon: Coffee },
  { id: 'forest', translationKey: 'settings.forest', icon: Leaf },
  { id: 'pink', translationKey: 'settings.pink', icon: Flower2 },
] as const

export function ThemeSelector() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function selectTheme(value: Theme) {
    setTheme(value)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={t('settings.changeTheme')}
        aria-expanded={open}
        aria-controls="theme-options"
        className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-ring flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div
          id="theme-options"
          className="border-border bg-popover text-popover-foreground absolute right-0 z-50 mt-2 w-52 rounded-xl border p-1.5 shadow-lg"
        >
          <p className="text-muted-foreground px-3 py-2 text-xs font-semibold">
            {t('settings.appearance')}
          </p>

          {themes.map((item) => {
            const Icon = item.icon
            const selected = theme === item.id

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => selectTheme(item.id)}
                className={`hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selected ? 'bg-accent/60' : ''
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {t(item.translationKey)}
                </span>

                {selected && <Check className="h-4 w-4" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
