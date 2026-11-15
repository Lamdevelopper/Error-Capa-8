import { COPY } from '../content'
import { dataSource } from '../data/source'
import { CrewCard } from '../components/CrewCard'
import { Icon } from '../components/Icon'

export function HomeScreen() {
  const crew = dataSource.crew()
  const needsReview = crew.filter(
    member => member.status === 'warn' || member.status === 'alert',
  ).length
  const alerts = crew.filter(member => member.status === 'alert').length

  return (
    <div className="home">
      <header className="home__head">
        <div className="home__intro">
          <span className="kicker">
            <span className="kicker__mark" aria-hidden="true" />
            {COPY.homeKicker}
          </span>
          <h1>Crew health board</h1>
          <p>{COPY.homeSubtitle}</p>
        </div>

        <div className="home__aside">
          <div className="home__stats">
            <div className="home-stat">
              <span className="home-stat__value">{String(crew.length).padStart(2, '0')}</span>
              <span className="home-stat__label">CREW ON BOARD</span>
            </div>
            <div className={`home-stat${needsReview > 0 ? ' is-warn' : ''}`}>
              <span className="home-stat__value">{String(needsReview).padStart(2, '0')}</span>
              <span className="home-stat__label">NEED REVIEW</span>
            </div>
            <div className={`home-stat${alerts > 0 ? ' is-alert' : ''}`}>
              <span className="home-stat__value">{String(alerts).padStart(2, '0')}</span>
              <span className="home-stat__label">ATTENTION</span>
            </div>
          </div>
          <p className="home__hint">
            <Icon name="target" size={15} />
            {COPY.homeHint}
          </p>
        </div>
      </header>

      <div className="home__grid">
        {crew.map((member, index) => (
          <CrewCard key={member.id} crew={member} index={index} />
        ))}
      </div>
    </div>
  )
}
