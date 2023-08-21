import * as React from 'react'

interface Size {
  scrollWidth: number
  scrollHeight: number
}

function debounce(func: Function) {
  let timer: any

  return (event: any) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(func, 2000, event)
  }
}

export function useElementScrollSize(ref: React.MutableRefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState<Size>({
    scrollWidth: 0,
    scrollHeight: 0,
  })

  React.useLayoutEffect(() => {
    const handleSize = () => {
      if (ref?.current?.scrollWidth && ref?.current?.scrollHeight) {
        setSize({
          scrollWidth: ref.current?.scrollWidth || 0,
          scrollHeight: ref.current?.scrollHeight || 0,
        })
      }
    }

    const debouncedHandler = debounce(handleSize)
    window.addEventListener('resize', debouncedHandler)
    handleSize()
    return () => window.removeEventListener('resize', debouncedHandler)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.current])

  return { scrollWidth: size.scrollWidth, scrollHeight: size.scrollHeight }
}
