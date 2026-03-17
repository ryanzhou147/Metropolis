interface Props {
  status?: string
  fadeOut?: boolean
}

export default function GlobeSkeleton({ status, fadeOut = false }: Props) {
  const size = 80

  const meridianStyle = (rotateY: number): React.CSSProperties => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    border: '1px solid #383838',
    transform: `rotateY(${rotateY}deg)`,
  })

  const equatorStyle: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    border: '1px solid #383838',
    transform: 'rotateX(90deg)',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: '#000000',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 400ms ease-out',
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Spinning wireframe globe */}
      <div
        style={{
          width: size,
          height: size,
          perspective: 200,
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            position: 'relative',
            transformStyle: 'preserve-3d',
            animation: 'globe-rotate 8s linear infinite',
          }}
        >
          {/* 3 meridian circles at 0°, 60°, 120° */}
          <div style={meridianStyle(0)} />
          <div style={meridianStyle(60)} />
          <div style={meridianStyle(120)} />
          {/* Equator */}
          <div style={equatorStyle} />
        </div>
      </div>

      {/* Status text */}
      {status && (
        <p
          className="text-xs tracking-widest uppercase"
          style={{
            color: 'var(--text-secondary)',
            letterSpacing: '0.2em',
            marginTop: 24,
          }}
        >
          {status}
        </p>
      )}
    </div>
  )
}
