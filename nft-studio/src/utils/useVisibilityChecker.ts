import * as React from 'react'

export type Options = {
  ref: React.RefObject<HTMLElement>
  marginTop?: number
  marginBottom?: number
  onChange?: () => void
  onEnter?: () => void
  onLeave?: () => void
  onEnterOnce?: () => void
}

export function useVisibilityChecker({
  ref,
  marginTop = 0,
  marginBottom = 0,
  onChange,
  onEnter,
  onLeave,
  onEnterOnce,
}: Options) {
  const state = React.useRef({
    triggered: false,
    wasVisible: false,
    isVisible: false,
    io: new IntersectionObserver(handleIntersection, {
      rootMargin: `${marginBottom}px 0px ${marginTop}px 0px`,
    }),
  }).current

  function handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (ref.current === entry.target) {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          state.isVisible = true
          state.wasVisible = false
        } else {
          state.isVisible = false
          state.wasVisible = true
        }
        runCallbacks()
      }
    })
  }

  function runCallbacks() {
    if (state.wasVisible !== state.isVisible) {
      onChange?.()
      if (state.isVisible) {
        onEnter?.()
      } else {
        onLeave?.()
      }

      if (state.isVisible && !state.triggered) {
        state.triggered = true
        onEnterOnce?.()
      }
    }
  }

  React.useEffect(() => {
    const node = ref.current
    if (node) state.io.observe(node)

    return () => {
      if (node) state.io.unobserve(node)
    }
    // eslint-disable-next-line
  }, [])
}
