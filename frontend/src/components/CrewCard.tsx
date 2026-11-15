import type { CrewMember } from '../data/types'
import { navigate, routes } from '../logic/route'
import { AstronautShape } from './AstronautShape'
import { CategoryChip } from './CategoryChip'
import { Icon } from './Icon'
import { RainbowStripe } from './RainbowStripe'
import { StatusBadge } from './StatusBadge'

export function CrewCard({ crew, index }: { crew: CrewMember; index: number }) {
  const openBoard = () => navigate(routes.astro(crew.id))

  return (
    <article className={`crew-card is-${crew.status}`}>
      <RainbowStripe />

      <button
        type="button"
        className="crew-card__portrait"
        onClick={openBoard}
        aria-label={`Open ${crew.name}'s health board`}
      >
        <span className="crew-card__index">CREW {String(index + 1).padStart(2, '0')}</span>
        <span className="crew-card__shape">
          <AstronautShape shape={crew.shape} size={218} status={crew.status} />
        </span>
        <span className="crew-card__open">
          OPEN BOARD
          <Icon name="arrowRight" size={16} />
        </span>
      </button>

      <div className="crew-card__body">
        <header className="crew-card__head">
          <div className="crew-card__identity">
            <span className="crew-card__role">{crew.role}</span>
            <h2>
              <button type="button" className="crew-card__name" onClick={openBoard}>
                {crew.name}
              </button>
            </h2>
            <span className="crew-card__location">{crew.location}</span>
          </div>
          <StatusBadge status={crew.status} />
        </header>

        <p className="crew-card__summary">{crew.summary}</p>

        <div className="crew-card__chips">
          {crew.categories.map(category => (
            <CategoryChip key={category.id} crewId={crew.id} category={category} />
          ))}
        </div>
      </div>
    </article>
  )
}
