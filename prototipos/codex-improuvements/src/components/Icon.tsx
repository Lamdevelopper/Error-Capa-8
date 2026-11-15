import type { IconName } from '../data/types'

const blade = 'M12 10.2 L8.6 4.3 A7 7 0 0 1 15.4 4.3 Z'

const PATHS: Record<IconName, JSX.Element> = {
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" fill="currentColor" stroke="none" />,
  plus: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" fill="currentColor" stroke="none" />,
  brain: (
    <>
      <path d="M11 5.5A2.8 2.8 0 0 0 6 6.8a3 3 0 0 0-2 4.7 3 3 0 0 0 1.4 4.6A3 3 0 0 0 11 18.5z" />
      <path d="M13 5.5a2.8 2.8 0 0 1 5 1.3 3 3 0 0 1 2 4.7 3 3 0 0 1-1.4 4.6 3 3 0 0 1-5.6 2.4z" />
      <path d="M7.5 10.5c1 0 1.8.6 2 1.5M16.5 10.5c-1 0-1.8.6-2 1.5M8 15h1.5M16 15h-1.5" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  lungs: (
    <>
      <path d="M12 3.5v8.5M12 11c-.8 1-2 1.5-3 1.5" />
      <path d="M9 7.5C8.6 5.8 7.2 5.3 6.2 6.3 4.3 8.4 3.5 12.6 3.5 16.4c0 2 1.8 3 3.6 2.1L9 17.6z" />
      <path d="M12 11c.8 1 2 1.5 3 1.5M15 7.5c.4-1.7 1.8-2.2 2.8-1.2 1.9 2.1 2.7 6.3 2.7 10.1 0 2-1.8 3-3.6 2.1L15 17.6z" />
    </>
  ),
  o2: (
    <>
      <circle cx="9" cy="12" r="5" />
      <path d="M16.5 15.5c0-1.2 3-1.4 3 .3 0 1.2-3 2.6-3 3.7h3.3" />
    </>
  ),
  thermo: (
    <>
      <path d="M10 13.8V5a2 2 0 0 1 4 0v8.8a4 4 0 1 1-4 0z" />
      <path d="M12 9v7" />
    </>
  ),
  drop: <path d="M12 3.2s6.2 7 6.2 11.2a6.2 6.2 0 0 1-12.4 0C5.8 10.2 12 3.2 12 3.2z" />,
  bone: <path d="M8.5 15.5l7-7M6.8 13.8a2.3 2.3 0 1 0-1.2 3.6 2.3 2.3 0 1 0 3.6-1.2M17.2 10.2a2.3 2.3 0 1 0 1.2-3.6 2.3 2.3 0 1 0-3.6 1.2" />,
  rad: (
    <g fill="currentColor" stroke="none">
      <circle cx="12" cy="12" r="1.8" />
      <path d={blade} transform="rotate(0 12 12)" />
      <path d={blade} transform="rotate(120 12 12)" />
      <path d={blade} transform="rotate(240 12 12)" />
    </g>
  ),
  wave: <path d="M2 12h4l2-5 3 10 3-8 2 3h6" />,
  run: (
    <>
      <circle cx="14" cy="4.5" r="1.6" fill="currentColor" />
      <path d="M9.5 21l2.5-6-3-3 2.5-4.5 3.5 3h3.5M6 12.5l2.5-4.5h3" />
    </>
  ),
  flask: <path d="M9 3h6M10 3v6l-5.2 9.2A1.9 1.9 0 0 0 6.5 21h11a1.9 1.9 0 0 0 1.7-2.8L14 9V3M7.3 15h9.4" />,
  bolt: <path d="M13.5 2.5L4.5 14h7l-1 7.5 9-11.5h-7z" fill="currentColor" stroke="none" />,
  bed: (
    <>
      <path d="M3 19V6M3 15h18v4M21 15a3 3 0 0 0-3-3h-7v3" />
      <circle cx="7" cy="11.5" r="1.7" />
    </>
  ),
  back: <path d="M20 12H5M11.5 5L4.5 12l7 7" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
}

export function Icon({ name, size = 32 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  )
}

