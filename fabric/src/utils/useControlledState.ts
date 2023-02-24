import { Dispatch, SetStateAction, useState } from 'react'
import useEventCallback from './useEventCallback'
import usePrevious from './usePrevious'

function useControlledState<T, D = Dispatch<T> | Dispatch<SetStateAction<T>>>(
  initialUncontrolledValue: T,
  externalValue?: T,
  setExternalValue?: D
): readonly [T, D extends Dispatch<T> ? Dispatch<T> : Dispatch<SetStateAction<T>>] {
  const [isControlled] = useState(externalValue !== undefined)
  const [internalValue, setInternalValue] = useState<T>(initialUncontrolledValue)

  if (process.env.NODE_ENV !== 'production') {
    const wasControlled = usePrevious(externalValue !== undefined) // eslint-disable-line
    if (wasControlled !== undefined && isControlled !== wasControlled) {
      // eslint-disable-next-line no-console
      console.error('useControlledState: Switching between controlled and uncontrolled is not supported')
    }
  }

  const value = isControlled ? externalValue! : internalValue
  const setValue = useEventCallback((newValue) => {
    if (setExternalValue) (setExternalValue as any)(newValue)
    if (!isControlled) setInternalValue(newValue)
  })

  return [value, setValue as any]
}

export default useControlledState
