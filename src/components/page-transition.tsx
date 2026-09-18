import { useEffect, useReducer, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

const LEAVE_MS = 280

export function PageTransition() {
  const location = useLocation()
  const outlet = useOutlet()
  const [, tick] = useReducer((count: number) => count + 1, 0)
  const snap = useRef({
    path: location.pathname,
    live: outlet,
    leaving: null as ReturnType<typeof useOutlet>,
  })

  if (location.pathname !== snap.current.path) {
    snap.current = {
      path: location.pathname,
      live: outlet,
      leaving: snap.current.live,
    }
  } else {
    snap.current.live = outlet
  }

  useEffect(() => {
    if (!snap.current.leaving) return
    const id = window.setTimeout(() => {
      snap.current.leaving = null
      tick()
    }, LEAVE_MS)
    return () => window.clearTimeout(id)
  }, [location.pathname])

  return (
    <div className="page-stage">
      {snap.current.leaving ? (
        <div className="page-layer page-leave" aria-hidden>
          {snap.current.leaving}
        </div>
      ) : null}
      <div className={snap.current.leaving ? 'page-layer page-enter' : undefined}>{outlet}</div>
    </div>
  )
}
