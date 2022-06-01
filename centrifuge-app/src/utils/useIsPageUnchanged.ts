import { useRouteMatch } from 'react-router'

export function useIsPageUnchanged(): () => boolean {
  const routeMatch = useRouteMatch()
  return () => routeMatch.url === window.location.pathname
}
