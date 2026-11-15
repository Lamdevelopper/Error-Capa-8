import { Icon } from './Icon'

export function BackButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className="back-button" onClick={onClick}>
      <Icon name="arrowLeft" size={18} />
      <span>{label}</span>
    </button>
  )
}
