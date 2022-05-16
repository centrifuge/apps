import { useEffect, useRef } from 'react'

function usePrevious<T = any>(value: T) {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export default usePrevious
