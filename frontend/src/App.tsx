import { useEffect } from 'react'
import { Footer } from './components/Footer'
import { RainbowRule } from './components/RainbowStripe'
import { TopBar } from './components/TopBar'
import { dataSource } from './data/source'
import { useKioskIdle } from './hooks/useKioskIdle'
import { navigate, routeKey, routes, useHashRoute } from './logic/route'
import { AstronautScreen } from './screens/AstronautScreen'
import { DetailScreen } from './screens/DetailScreen'
import { DevWidgetsPage } from './screens/DevWidgetsPage'
import { HomeScreen } from './screens/HomeScreen'
import { NotFound } from './screens/NotFound'
import { Stage } from './stage/Stage'

const APP_NAME = 'iluikali.health'

function screenTitle(route: ReturnType<typeof useHashRoute>): string {
  if (route.name === 'astro') {
    const crew = dataSource.astronaut(route.crewId)
    return crew ? `${crew.name} · ${APP_NAME}` : `Signal lost · ${APP_NAME}`
  }
  if (route.name === 'detail') {
    const crew = dataSource.astronaut(route.crewId)
    const metric = crew?.metrics.find(item => item.id === route.metricId)
    return metric && crew
      ? `${metric.label} · ${crew.name} · ${APP_NAME}`
      : `Signal lost · ${APP_NAME}`
  }
  if (route.name === 'dev') return `Widget lab · ${APP_NAME}`
  if (route.name === 'notfound') return `Signal lost · ${APP_NAME}`
  return `Crew health board · ${APP_NAME}`
}

export default function App() {
  const route = useHashRoute()
  const kioskActive = route.name === 'astro' || route.name === 'detail'

  useKioskIdle(kioskActive, () => navigate(routes.home()))

  useEffect(() => {
    document.title = screenTitle(route)
  }, [route])

  return (
    <Stage>
      <div className="app-shell">
        <TopBar />
        <RainbowRule />

        <main className="screen" key={routeKey(route)}>
          {route.name === 'home' && <HomeScreen />}
          {route.name === 'astro' && <AstronautScreen crewId={route.crewId} />}
          {route.name === 'detail' && (
            <DetailScreen
              crewId={route.crewId}
              category={route.category}
              metricId={route.metricId}
            />
          )}
          {route.name === 'dev' && <DevWidgetsPage />}
          {route.name === 'notfound' && <NotFound />}
        </main>

        <Footer route={route} />
      </div>
    </Stage>
  )
}
