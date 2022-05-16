import { Dispatch, SetStateAction, useState } from 'react'
import useEventCallback from './useEventCallback'
import usePrevious from './usePrevious'

function useControlledState<T>(
  initialUncontrolledValue: T,
  externalValue?: T,
  setExternalValue?: Dispatch<SetStateAction<T>>
) {
  const [isControlled] = useState(externalValue !== undefined)
  const [internalValue, setInternalValue] = useState<T>(initialUncontrolledValue)

  if (process.env.NODE_ENV !== 'production') {
    const wasControlled = usePrevious(externalValue !== undefined) // eslint-disable-line
    if (wasControlled !== undefined && isControlled !== wasControlled) {
      // eslint-disable-next-line no-console
      console.error('useControlledState: Switching between controlled and uncontrolled is not supported')
    }
  }

  const value = isControlled ? externalValue : internalValue
  const setValue = useEventCallback((newValue: SetStateAction<T>) => {
    if (setExternalValue) setExternalValue(newValue)
    if (!isControlled) setInternalValue(newValue)
  })

  return [value, setValue] as const
}

export default useControlledState
