import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { getContentArcs, getContentPoints } from './api/client'
import { EVENT_TYPE_COLORS, useAppContext } from './context/AppContext'
import type { ArcData } from './context/AppContext'
import type { Event, EventType, TimelineResponse } from './types/events'

const GlobeView = lazy(() => import('./components/Globe/GlobeView'))
import FilterBar from './components/Filters/FilterBar'
import TimelineSlider from './components/Timeline/TimelineSlider'
import EventModal from './components/Modal/EventModal'
import AgentLauncherButton from './components/Agent/AgentLauncherButton'
import AgentPanel from './components/Agent/AgentPanel'
import ErrorBoundary from './components/ErrorBoundary'
import DesktopOnlyGuard from './components/DesktopOnlyGuard'
import GlobeSkeleton from './components/Globe/GlobeSkeleton'

function ErrorOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <p className="text-xs mb-2 tracking-wider uppercase" style={{ color: '#8a3030' }}>Failed to connect to backend.</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Make sure the FastAPI server is running at http://localhost:8000</p>
    </div>
  )
}

function EmptyDataOverlay() {
  const { events } = useAppContext()
  if (events.length > 0) return null
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(8,8,8,0.6) 40%, rgba(8,8,8,0.85) 70%)' }}
    >
      <p className="text-sm tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
        No event data to display
      </p>
      <p className="text-xs mt-2 max-w-md text-center" style={{ color: 'var(--text-muted)' }}>
        Points appear when <code className="opacity-80">content_table</code> has rows with latitude, longitude, and <code className="opacity-80">published_at</code> in the last 31 days. Run scrapers and geocode (e.g. <code className="opacity-80">geocode_events</code>) or seed the DB to see events on the globe.
      </p>
    </div>
  )
}

function FilteredEmptyOverlay() {
  const { events, activeFilters, timelinePosition } = useAppContext()
  if (events.length === 0) return null

  const hasVisible = events.some(evt => {
    if (!activeFilters.has(evt.event_type)) return false
    if (timelinePosition && new Date(evt.start_time) > timelinePosition) return false
    return true
  })

  if (hasVisible) return null

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
      style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(8,8,8,0.4) 40%, rgba(8,8,8,0.7) 70%)' }}
    >
      <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
        No events match current filters
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        Adjust the event type filters or timeline to see events.
      </p>
    </div>
  )
}

export default function App() {
  const { setEvents, setTimeline, setArcs } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [skeletonGone, setSkeletonGone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When data loading finishes, trigger fade-out then remove skeleton
  const finishLoading = useCallback(() => {
    setLoading(false)
    setFadeOut(true)
    setTimeout(() => setSkeletonGone(true), 450)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [data, arcsData] = await Promise.all([
          getContentPoints(),
          getContentArcs(0.4).catch(() => ({ arcs: [] })),
        ])
        if (cancelled) return

        const KNOWN_TYPES: EventType[] = [
          'geopolitics', 'trade_supply_chain', 'energy_commodities',
          'financial_markets', 'climate_disasters', 'policy_regulation',
        ]

        const mappedEvents: Event[] = data.points.map(p => ({
          id: p.id,
          title: p.title ?? 'Unknown',
          event_type: (KNOWN_TYPES.includes(p.event_type as EventType)
            ? p.event_type
            : 'geopolitics') as EventType,
          primary_latitude: p.latitude,
          primary_longitude: p.longitude,
          start_time: p.published_at ?? new Date().toISOString(),
          end_time: null,
          confidence_score: 0.5,
          canada_impact_summary: '',
          image_url: p.image_url ?? null,
        }))

        const times = mappedEvents
          .map(e => new Date(e.start_time).getTime())
          .filter(t => !isNaN(t))
        const twoWeeksAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
        const minTime = twoWeeksAgo.toISOString()
        const maxTime = times.length
          ? new Date(Math.max(...times)).toISOString()
          : new Date().toISOString()

        const syntheticTimeline: TimelineResponse = {
          events: mappedEvents,
          min_time: minTime,
          max_time: maxTime,
        }

        const mappedArcs: ArcData[] = arcsData.arcs.map(a => {
          const eventType = (KNOWN_TYPES.includes(a.event_type_a as EventType)
            ? a.event_type_a
            : 'geopolitics') as EventType
          return {
            startLat: a.start_lat,
            startLng: a.start_lng,
            endLat: a.end_lat,
            endLng: a.end_lng,
            color: EVENT_TYPE_COLORS[eventType],
            relationshipType: 'embedding_similarity',
            eventAId: a.event_a_id,
            eventBId: a.event_b_id,
          }
        })

        setTimeline(syntheticTimeline)
        setEvents(mappedEvents)
        setArcs(mappedArcs)
        finishLoading()
      } catch (e) {
        if (!cancelled) {
          setError(String(e))
          setLoading(false)
          setSkeletonGone(true)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [setEvents, setTimeline, setArcs, finishLoading])

  if (loading) return <GlobeSkeleton status="Connecting to intelligence network..." />
  if (error) return <ErrorOverlay message={error} />

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <DesktopOnlyGuard />

      {/* Globe — full screen base layer */}
      <div className="absolute inset-0">
        <ErrorBoundary fallback={
          <div className="flex flex-col items-center justify-center h-full" style={{ background: 'var(--bg-base)' }}>
            <p className="text-xs tracking-widest uppercase mb-3" style={{ color: '#8a3030' }}>Globe visualization failed to load</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs tracking-wider uppercase px-4 py-2 border border-[#505050] hover:border-[#808080] transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'transparent' }}
            >
              Reload
            </button>
          </div>
        }>
          <Suspense fallback={
            <GlobeSkeleton status="Rendering globe..." />
          }>
            <GlobeView />
          </Suspense>
        </ErrorBoundary>
      </div>
      {/* Empty state when backend returned no points (no DB data or no geocoded content in last 31 days) */}
      <EmptyDataOverlay />
      {/* Empty state when events exist but all are filtered out */}
      <FilteredEmptyOverlay />

      {/* Filter bar — top overlay */}
      <FilterBar />

      {/* Timeline slider — bottom overlay */}
      <TimelineSlider />

      {/* Event modal — right side overlay */}
      <ErrorBoundary fallback={
        <div className="fixed right-0 top-0 h-full w-96 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
          <p className="text-xs tracking-widest uppercase" style={{ color: '#8a3030' }}>Event details failed to load</p>
        </div>
      }>
        <EventModal />
      </ErrorBoundary>

      {/* Agent panel — left slide-out overlay */}
      <ErrorBoundary fallback={
        <div className="fixed left-0 top-0 h-full w-96 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
          <p className="text-xs tracking-widest uppercase" style={{ color: '#8a3030' }}>Agent encountered an error</p>
        </div>
      }>
        <AgentPanel />
      </ErrorBoundary>

      {/* Agent launcher button — top-right corner */}
      <AgentLauncherButton />

      {/* Fade-out skeleton overlay — shows briefly after data loads while globe renders */}
      {!skeletonGone && <GlobeSkeleton status="Rendering globe..." fadeOut={fadeOut} />}
    </div>
  )
}
