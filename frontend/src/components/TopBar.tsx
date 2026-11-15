import { useClock } from '../hooks/useClock'
import { useOnline } from '../hooks/useOnline'
import { COPY } from '../content'
import { Icon } from './Icon'

function BrandMark() {
  return (
    <span className="brand__mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="48" height="48">
        <rect width="48" height="48" fill="var(--card)" />
        <polygon points="0,10 10,0 21,0 0,21" fill="var(--stripe-1)" />
        <polygon points="0,25 25,0 36,0 0,36" fill="var(--stripe-2)" />
        <polygon points="0,40 40,0 48,0 0,48" fill="var(--stripe-3)" />
        <rect x="31" y="9" width="5" height="5" fill="var(--stripe-1)" />
        <rect x="39" y="17" width="4" height="4" fill="var(--stripe-2)" opacity=".8" />
        <rect x="28" y="22" width="3" height="3" fill="var(--stripe-3)" opacity=".7" />
      </svg>
    </span>
  )
}

export function TopBar() {
  const clock = useClock()
  const online = useOnline()

  return (
    <header className="topbar">
      <a className="brand" href="#/" aria-label="Crew health board home">
        <BrandMark />
        <span className="brand__copy">
          <span className="brand__studio">{COPY.studio}</span>
          <span className="brand__name">
            iluikali<span>.health</span>
          </span>
        </span>
      </a>

      <div className="topbar__mission">
        <span className="topbar__kicker">CREW HEALTH MONITOR</span>
        <span className="topbar__route">
          {COPY.mission}
          <span className="topbar__route-mark" aria-hidden="true" />
          LONG-DURATION TRANSIT
        </span>
      </div>

      <div className="topbar__right">
        <span className={`link-state${online ? '' : ' link-state--offline'}`}>
          <span className="link-state__dot" aria-hidden="true" />
          {online ? COPY.online : COPY.offline}
        </span>
        <span className="topbar__clock">
          <Icon name="clock" size={16} />
          {clock} UTC
        </span>
        <span className="topbar__demo">{COPY.demo}</span>
      </div>
    </header>
  )
}
