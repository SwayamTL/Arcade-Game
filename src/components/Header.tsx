import railsFactoryWordmark from '../assets/brand/railsfactory-wordmark.svg'
import rubyConfIndiaLogo from '../assets/brand/rubyconf-india.svg'
import { EVENT, SITE } from '../content/copy'

export function Header() {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        <img src={railsFactoryWordmark} alt="RailsFactory" width={240} height={26} className="h-6 w-auto self-start" />
        <h1 className="text-3xl font-medium sm:text-4xl">{SITE.title}</h1>
        <p className="max-w-xl text-ink/80">{SITE.tagline}</p>
      </div>
      <div className="flex flex-col gap-1 sm:items-end sm:text-right">
        <img src={rubyConfIndiaLogo} alt={EVENT.name} width={192} height={32} className="h-8 w-auto self-start sm:self-end" />
        <p className="text-sm">{EVENT.dateVenue}</p>
        <p className="text-sm font-medium text-accent">{EVENT.booth}</p>
      </div>
    </header>
  )
}
