import { Grid3X3, House, Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

const navigation = [
  {
    labelKey: 'navigation.home',
    to: '/',
    icon: House,
  },
  {
    labelKey: 'navigation.cards',
    to: '/cards',
    icon: Grid3X3,
  },
  {
    labelKey: 'navigation.bingos',
    to: '/bingos',
    icon: Ticket,
  },
]

export function BottomNavigation() {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t('navigation.ariaLabel')}
      className="bg-card/95 border-border fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md"
    >
      <div className="mx-auto grid h-16 max-w-3xl grid-cols-3">
        {navigation.map(({ labelKey, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center justify-center gap-1 text-xs transition-colors"
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex h-8 w-16 items-center justify-center rounded-full transition-colors duration-200 ${
                    isActive ? 'bg-primary/10' : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`size-5 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </div>

                <span
                  className={`transition-colors ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground font-medium'
                  }`}
                >
                  {t(labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
