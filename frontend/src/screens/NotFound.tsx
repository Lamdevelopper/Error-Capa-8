import { navigate, routes } from '../logic/route'

export function NotFound({
  title = 'Signal lost',
  message = 'This screen does not match a route in the demo.',
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="notfound">
      <span className="kicker">ROUTE NOT FOUND</span>
      <h1>{title}</h1>
      <p>{message}</p>
      <button
        type="button"
        className="button button--primary"
        onClick={() => navigate(routes.home())}
      >
        Return to crew board
      </button>
    </div>
  )
}
