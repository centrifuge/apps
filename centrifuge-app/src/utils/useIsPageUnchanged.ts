import { useLocation } from 'react-router-dom';
import { useRef } from 'react';

export function useIsPageUnchanged(): () => boolean {
  const location = useLocation();
  const initialPath = useRef(location.pathname);

  return () => initialPath.current === location.pathname;
}
