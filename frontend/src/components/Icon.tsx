import type { ReactNode } from 'react'

export type IconName =
  | 'moon'
  | 'sparkle'
  | 'steps'
  | 'heart'
  | 'pulse'
  | 'gauge'
  | 'lung'
  | 'bone'
  | 'atom'
  | 'thermo'
  | 'flask'
  | 'wave'
  | 'smile'
  | 'bolt'
  | 'clock'
  | 'shield'
  | 'link'
  | 'close'
  | 'check'
  | 'alert'
  | 'info'
  | 'arrowLeft'
  | 'arrowRight'
  | 'chevronRight'
  | 'external'
  | 'target'
  | 'signal'

const PATHS: Record<IconName, ReactNode> = {
  moon: <path d="M20.2 14.3A8.5 8.5 0 1 1 9.7 3.8a7 7 0 0 0 10.5 10.5Z" />,
  sparkle: <path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5-2-6.5L3.5 11 10 9Z" />,
  steps: (
    <>
      <path d="M7 4c-1.5 0-2.5 1.6-2.5 3.6S5.5 12 7 12s2.5-2.4 2.5-4.4S8.5 4 7 4Z" />
      <path d="M17 10c-1.5 0-2.5 1.6-2.5 3.6s1 4.4 2.5 4.4 2.5-2.4 2.5-4.4S18.5 10 17 10Z" />
      <path d="M5 15h4M15 21h4" />
    </>
  ),
  heart: <path d="M12 20.4 4.6 13a5 5 0 0 1 7.4-6.7 5 5 0 0 1 7.4 6.7Z" />,
  pulse: <path d="M2.5 12h4l2-5.5 3.5 11 2.5-7 2 1.5h5" />,
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4.5-5" />
      <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  lung: (
    <>
      <path d="M12 3v9" />
      <path d="M11.8 12c-.3-3-2.2-5-4.6-5S3 9 3 12v5a3 3 0 0 0 5.4 1.7L12 14" />
      <path d="M12.2 12c.3-3 2.2-5 4.6-5S21 9 21 12v5a3 3 0 0 1-5.4 1.7L12 14" />
    </>
  ),
  bone: <path d="M17 10c.7-.7 1.7 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .8.7 1.8 0 2.5l-7 7c-.7.7-1.7 0-2.5 0a2.5 2.5 0 1 0 0 5c.3 0 .5.2.5.5a2.5 2.5 0 1 0 5 0c0-.8-.7-1.8 0-2.5Z" />,
  atom: (
    <>
      <circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
    </>
  ),
  thermo: (
    <>
      <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z" />
      <path d="M12 9v6" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5" />
      <path d="M10 3v5.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 8.5V3" />
      <path d="M7 14h10" />
    </>
  ),
  wave: <path d="M2 12h3.5l2-6 4 12 3-9 2 3H22" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14a4 4 0 0 0 7 0" />
      <circle cx="9" cy="9.5" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  bolt: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  shield: <path d="M12 2.5 20 6v6c0 5-3.4 8-8 9.5C7.4 20 4 17 4 12V6Z" />,
  link: (
    <>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.3 6.5" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.5-1.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="M4.5 12.5 9 17 19.5 6.5" />,
  alert: (
    <>
      <path d="M12 3 22 20H2Z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  arrowLeft: <path d="M20 12H4m0 0 6-6m-6 6 6 6" />,
  arrowRight: <path d="M4 12h16m0 0-6-6m6 6-6 6" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  signal: (
    <>
      <path d="M4 19v-4M9.3 19v-8M14.7 19V7M20 19V4" />
    </>
  ),
}

type Props = {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}

export function Icon({ name, size = 24, strokeWidth = 1.8, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

export const METRIC_ICON: Record<string, IconName> = {
  sleep: 'moon',
  sleepQuality: 'sparkle',
  movement: 'steps',
  heartRate: 'heart',
  bloodPressure: 'gauge',
  spo2: 'lung',
  osteocalcin: 'bone',
  radiation: 'atom',
  temperature: 'thermo',
  cortisol: 'flask',
  hrv: 'wave',
  mood: 'smile',
}

export const categoryIcon = (category: string): IconName => {
  if (category === 'sleep') return 'moon'
  if (category === 'general') return 'heart'
  return 'bolt'
}
