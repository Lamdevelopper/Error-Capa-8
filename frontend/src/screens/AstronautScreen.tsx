import { AstronautShape } from '../components/AstronautShape'
import { BackButton } from '../components/BackButton'
import { CategoryPanel } from '../components/CategoryPanel'
import { StatusBadge } from '../components/StatusBadge'
import { dataSource } from '../data/source'
import { navigate, routes } from '../logic/route'
import { NotFound } from './NotFound'

export function AstronautScreen({ crewId }: { crewId: string }) {
  const crew = dataSource.astronaut(crewId)

  if (!crew) {
    return (
      <NotFound
        title="Crew member not found"
        message={`No synthetic crew profile matches "${crewId}". Return to the board and choose a shape.`}
      />
    )
  }

  return (
    <div className="board">
      <header className="board__head">
        <div className="board__identity">
          <BackButton label="CREW BOARD" onClick={() => navigate(routes.home())} />
          <div className="board__person">
            <span className="board__shape">
              <AstronautShape shape={crew.shape} size={76} status={crew.status} />
            </span>
            <div>
              <span className="kicker">
                {crew.role} · {crew.location}
              </span>
              <h1>{crew.name}</h1>
            </div>
          </div>
        </div>

        <div className="board__summary">
          <span className="kicker">OVERALL CREW STATUS</span>
          <div className="board__summary-row">
            <StatusBadge status={crew.status} />
            <p>{crew.summary}</p>
          </div>
        </div>
      </header>

      <div className="board__grid">
        {crew.categories.map(category => (
          <CategoryPanel key={category.id} crew={crew} category={category} />
        ))}
      </div>
    </div>
  )
}
