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
        aria-haspopup="menu"
        className={`text-foreground focus-visible:outline-ring flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
          open
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div
          id="theme-options"
          role="menu"
          aria-label={t('settings.appearance')}
          className="border-border bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute right-0 z-50 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border shadow-lg motion-reduce:animate-none"
        >
          {/* Header — mesmo padrão do LanguageSelector */}
          <div className="border-border text-muted-foreground flex items-center gap-1.5 border-b px-3 py-2 text-[10px] font-semibold tracking-wider uppercase">
            <span className="bg-primary size-1.5 rounded-full" />
            {t('settings.appearance')}
          </div>

          <div className="p-1.5" role="none">
            {themes.map((item) => {
              const Icon = item.icon
              const selected = theme === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => selectTheme(item.id)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${
                        selected ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    {t(item.translationKey)}
                  </span>

                  {selected && (
                    <Check className="text-primary h-4 w-4 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
