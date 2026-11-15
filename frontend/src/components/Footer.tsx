import type { Route } from '../logic/route'
import { COPY } from '../content'
import { Icon } from './Icon'
import { statusLabel } from '../logic/status'

const LEGEND = ['ok', 'warn', 'alert', 'unknown'] as const

export function Footer({ route }: { route: Route }) {
  const showAutoReturn = route.name === 'astro' || route.name === 'detail'

  return (
    <footer className="footer">
      <p className="footer__note">
        <Icon name="shield" size={15} />
        {COPY.footer}
      </p>

      <div className="footer__legend" aria-label="Health status legend">
        <span className="footer__legend-label">LEGEND</span>
        {LEGEND.map(status => (
          <span key={status} className={`legend-item is-${status}`}>
            <span className="legend-item__dot" aria-hidden="true" />
            {statusLabel(status)}
          </span>
        ))}
      </div>

      <div className="footer__right">
        {showAutoReturn && (
          <span className="autoreturn">
            <span className="autoreturn__dot" aria-hidden="true" />
            AUTO-RETURN · 60s IDLE
          </span>
        )}
        <a
          className="footer__link"
          href="https://www.nasa.gov/hrp/risks/"
          target="_blank"
          rel="noreferrer"
        >
          NASA HRP RISKS
          <Icon name="external" size={13} />
        </a>
        <a className="footer__dev" href="#/dev/widgets">
          WIDGET LAB
        </a>
      </div>
    </footer>
  )
}
