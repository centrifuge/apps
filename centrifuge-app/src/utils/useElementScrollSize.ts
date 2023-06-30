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

export function useElementScrollSize<T extends HTMLElement = HTMLDivElement>(): [(node: T | null) => void, Size] {
  const [node, setNode] = React.useState<T | null>(null)
  const nodeRef = React.useRef(node)

  const [size, setSize] = React.useState<Size>({
    scrollWidth: 0,
    scrollHeight: 0,
  })

  React.useLayoutEffect(() => {
    nodeRef.current = node
  }, [node])

  React.useLayoutEffect(() => {
    const handleSize = () => {
      if (nodeRef.current?.scrollWidth && nodeRef.current?.scrollHeight) {
        setSize({
          scrollWidth: nodeRef.current?.scrollWidth || 0,
          scrollHeight: nodeRef.current?.scrollHeight || 0,
        })
      }
    }

    const debouncedHandler = debounce(handleSize)
    window.addEventListener('resize', debouncedHandler)
    handleSize()
    return () => window.removeEventListener('resize', debouncedHandler)
  }, [node])

  return [setNode, size]
}
