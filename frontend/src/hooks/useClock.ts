import { useEffect, useState } from 'react'

const FORMAT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

export function useClock(): string {
  const [time, setTime] = useState(() => FORMAT.format(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => setTime(FORMAT.format(new Date())), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return time
}
