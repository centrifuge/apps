import { Dispatch, SetStateAction, useState } from 'react'
import useEventCallback from './useEventCallback'

function useControlledState<T, D = Dispatch<T> | Dispatch<SetStateAction<T>>>(
  initialUncontrolledValue: T,
  externalValue?: T,
  setExternalValue?: D
): readonly [T, D extends Dispatch<T> ? Dispatch<T> : Dispatch<SetStateAction<T>>] {
  const [internalValue, setInternalValue] = useState<T>(initialUncontrolledValue)

  const isControlled = externalValue !== undefined
  const value = isControlled ? externalValue : internalValue
  const setValue = useEventCallback((newValue) => {
    if (setExternalValue) (setExternalValue as any)(newValue)
    if (!isControlled) setInternalValue(newValue)
  })

  return [value, setValue as any]
}

export default useControlledState
