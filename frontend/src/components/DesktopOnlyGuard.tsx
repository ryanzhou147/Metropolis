import { useEffect, useState } from 'react'

const MIN_WIDTH = 1024

export default function DesktopOnlyGuard() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MIN_WIDTH)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MIN_WIDTH - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (!isMobile) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-10 h-10 mb-6 border border-[#505050]" style={{ borderRadius: 0 }} />
      <p className="text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
        Desktop Required
      </p>
      <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Argus is best experienced on a desktop browser. The 3D globe requires a larger viewport and mouse interaction.
      </p>
    </div>
  )
}
