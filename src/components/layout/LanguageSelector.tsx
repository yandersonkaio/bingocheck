import { Check, ChevronDown, Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const languages = [
  {
    code: 'pt-BR',
    label: 'Português (Brasil)',
    short: 'PT',
    flag: '🇧🇷',
  },
  {
    code: 'en',
    label: 'English',
    short: 'EN',
    flag: '🇺🇸',
  },
  {
    code: 'es',
    label: 'Español',
    short: 'ES',
    flag: '🇪🇸',
  },
  {
    code: 'it',
    label: 'Italiano',
    short: 'IT',
    flag: '🇮🇹',
  },
] as const

export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.resolvedLanguage) ??
    languages.find((lang) => lang.code === i18n.language) ??
    languages[0]

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  async function handleLanguageChange(language: string) {
    if (language === currentLanguage.code) {
      setIsOpen(false)
      return
    }

    try {
      await i18n.changeLanguage(language)

      localStorage.setItem('bingocheck:language', language)

      document.documentElement.lang = language

      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao alterar idioma:', error)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t('settings.selectLanguage')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
        className={`border-border bg-card text-card-foreground flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
          isOpen
            ? 'border-primary/50 bg-accent'
            : 'hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <Languages className="h-4 w-4" />

        <span
          className="text-base leading-none"
          role="img"
          aria-label={currentLanguage.label}
        >
          {currentLanguage.flag}
        </span>

        <span className="hidden sm:inline">{currentLanguage.short}</span>

        <ChevronDown
          className={`hidden h-3.5 w-3.5 transition-transform duration-200 sm:block ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t('settings.availableLanguages')}
          className="border-border bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute top-full right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border shadow-lg motion-reduce:animate-none"
        >
          <div className="border-border text-muted-foreground flex items-center gap-1.5 border-b px-3 py-2 text-[10px] font-semibold tracking-wider uppercase">
            <span className="bg-primary size-1.5 rounded-full" />
            {t('settings.currentLanguage', {
              defaultValue: 'Idioma atual',
            })}
          </div>

          <div className="p-1.5">
            {languages.map((language) => {
              const selected = currentLanguage.code === language.code

              return (
                <button
                  key={language.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    handleLanguageChange(language.code).catch((error) => {
                      console.error('Erro ao alterar idioma:', error)
                    })
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="text-lg leading-none"
                      role="img"
                      aria-label={language.label}
                    >
                      {language.flag}
                    </span>

                    <span>{language.label}</span>
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
