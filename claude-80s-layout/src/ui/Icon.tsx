import type { IconName } from '../core/data/types'

/**
 * Una sola familia de íconos: caja 24×24, trazo 1.75, extremos redondeados, todos de
 * contorno (geometría basada en Lucide, licencia ISC). Mismo peso visual en todo el producto.
 */
const HEART = 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z'

const PATHS: Record<IconName, JSX.Element> = {
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  pulse: <><path d={HEART} /><path d="M3.2 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  brain: (
    <>
      <path d="M12 5a3 3 0 1 0-6 .1 4 4 0 0 0-2.5 5.8 4 4 0 0 0 .6 6.6A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 6 .1 4 4 0 0 1 2.5 5.8 4 4 0 0 1-.6 6.6A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4M12 5v13" />
    </>
  ),
  heart: <path d={HEART} />,
  lungs: (
    <>
      <path d="M12 3.5V12M12 11c-.8 1-2 1.5-3 1.5M12 11c.8 1 2 1.5 3 1.5" />
      <path d="M9 7.5C8.6 5.8 7.2 5.3 6.2 6.3 4.3 8.4 3.5 12.6 3.5 16.4c0 2 1.8 3 3.6 2.1L9 17.6Z" />
      <path d="M15 7.5c.4-1.7 1.8-2.2 2.8-1.2 1.9 2.1 2.7 6.3 2.7 10.1 0 2-1.8 3-3.6 2.1L15 17.6Z" />
    </>
  ),
  o2: <><circle cx="9" cy="12" r="5" /><path d="M16.5 15.5c0-1.2 3-1.4 3 .3 0 1.2-3 2.6-3 3.7h3.3" /></>,
  thermo: <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />,
  drop: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />,
  bone: <path d="M17 10c.7-.7 1.7 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .8.7 1.8 0 2.5l-7 7c-.7.7-1.7 0-2.5 0a2.5 2.5 0 0 0 0 5c.3 0 .5.2.5.5a2.5 2.5 0 1 0 5 0c0-.8-.7-1.8 0-2.5Z" />,
  rad: (
    <>
      <circle cx="12" cy="12" r="1.5" />
      <path d="M7.5 4.2c-.3-.5-.9-.7-1.3-.4C3.9 5.5 2.3 8.1 2 11c-.1.5.4 1 1 1h5c0-1.5.8-2.8 2-3.4-1.1-1.9-2-3.5-2.5-4.4Z" />
      <path d="M21 12c.6 0 1-.4 1-1-.3-2.9-1.8-5.5-4.1-7.1-.4-.3-1.1-.2-1.3.3-.6.9-1.5 2.5-2.6 4.3 1.2.7 2 2 2 3.5h5Z" />
      <path d="M7.5 19.8c-.3.5-.1 1.1.4 1.3 2.6 1.2 5.6 1.2 8.2 0 .5-.2.7-.8.4-1.3-.5-.9-1.4-2.5-2.5-4.3-1.2.7-2.8.7-4 0-1.1 1.8-2 3.4-2.5 4.3Z" />
    </>
  ),
  wave: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  run: <><circle cx="14" cy="4.5" r="1.6" /><path d="M9.5 21l2.5-6-3-3 2.5-4.5 3.5 3h3.5M6 12.5l2.5-4.5h3" /></>,
  flask: <path d="M10 2v7.5a2 2 0 0 1-.2.9L4.7 20.6a1 1 0 0 0 .9 1.4h12.8a1 1 0 0 0 .9-1.4l-5.1-10.2a2 2 0 0 1-.2-.9V2M8.5 2h7M7 16h10" />,
  bolt: <path d="M4 14a1 1 0 0 1-.8-1.6l9.9-10.2a.5.5 0 0 1 .9.5l-1.9 6A1 1 0 0 0 13 10h7a1 1 0 0 1 .8 1.6l-9.9 10.2a.5.5 0 0 1-.9-.5l1.9-6A1 1 0 0 0 11 14Z" />,
  bed: <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />,
  back: <path d="m15 18-6-6 6-6" />,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  expand: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  shrink: <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />,
  check: <path d="M20 6 9 17l-5-5" />,
  stomach: <path d="M9 3v4c0 2-1 3-3 3.5S3 13 3 15.5C3 19 6 21 10 21c5.5 0 11-3.5 11-9.5 0-3-1.8-5-4.5-5S13 8 12.5 9.5c-.4 1.2-1.5 1.5-2.5 1M9 3h3" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  upload: <path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />,
  download: <path d="M12 3v12M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  swap: <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
}

export function Icon({ name, size = 22, stroke = 1.75 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="icon">
      {PATHS[name]}
    </svg>
  )
}
