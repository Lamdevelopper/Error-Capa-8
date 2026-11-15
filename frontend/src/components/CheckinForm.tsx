import { useState } from 'react'

const QUESTIONS = [
  { id: 'sleep', label: 'How did you sleep?', low: 'Poor', high: 'Good' },
  { id: 'energy', label: 'How is your energy now?', low: 'Drained', high: 'Charged' },
  { id: 'stress', label: 'How is your stress load?', low: 'Light', high: 'Heavy' },
] as const

type QuestionId = (typeof QUESTIONS)[number]['id']

export function CheckinForm({
  onSave,
  onCancel,
}: {
  onSave: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<Record<QuestionId, number>>({
    sleep: 3,
    energy: 3,
    stress: 3,
  })

  return (
    <form
      className="checkin"
      onSubmit={event => {
        event.preventDefault()
        onSave()
      }}
    >
      <p className="checkin__intro">
        Three quick questions. The answers stay in this local demo session and are not
        transmitted.
      </p>

      {QUESTIONS.map(question => (
        <label className="checkin__row" key={question.id}>
          <span className="checkin__label">
            <strong>{question.label}</strong>
            <span>
              {question.low} <span aria-hidden="true">···</span> {question.high}
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={values[question.id]}
            onChange={event =>
              setValues(current => ({
                ...current,
                [question.id]: Number(event.target.value),
              }))
            }
            aria-label={question.label}
          />
          <span className="checkin__value">{values[question.id]}</span>
        </label>
      ))}

      <p className="checkin__meta">1 = low · 5 = high · self-report</p>

      <div className="modal-actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary">
          Save check-in
        </button>
      </div>
    </form>
  )
}
