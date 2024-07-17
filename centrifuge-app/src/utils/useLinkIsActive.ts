import { Location } from 'history'
import { NavLinkProps, matchPath, useLocation } from 'react-router-dom'

type Params = Pick<NavLinkProps, 'to' | 'location' | 'isActive'> & { exact?: boolean; strict?: boolean }

export function useLinkIsActive({
  to,
  location: locationOverride,
  isActive: isActiveCb,
  exact = false,
  strict = false,
}: Params) {
  const location = useLocation()
  const currentLocation = locationOverride || location
  const toLocation = normalizeToLocation(resolveToLocation(to, currentLocation), currentLocation)

  const { pathname: path } = toLocation
  // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202
  const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')

  const match = escapedPath
    ? matchPath(
        {
          path: escapedPath,
          end: exact, // Use `end` instead of `exact` for strict matching
          caseSensitive: false, // Use `caseSensitive` instead of `sensitive`
        },
        currentLocation.pathname
      )
    : null

  const isActive = !!(isActiveCb ? isActiveCb(match, currentLocation) : match)

  return isActive
}

function resolveToLocation(to: Params['to'], currentLocation: Location) {
  return typeof to === 'function' ? to(currentLocation) : to
}

function normalizeToLocation(to: string | Partial<Location>, currentLocation: Location): Location {
  if (typeof to === 'string') {
    return {
      ...currentLocation,
      pathname: to,
    }
  }
  return to as Location
}
