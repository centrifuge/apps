import { useCallback, useState } from 'react';

export function useMergeState<S>(initialState: S): [S, (value: Partial<S>) => void] {
  const [state, setState] = useState<S>(initialState);
  const setMergedState = useCallback(newState =>
    setState(prevState => ({
        ...prevState,
        ...newState,
      }),
    ),[setState]);
  return [state, setMergedState];
}
