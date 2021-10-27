import { createLocation, LocationDescriptor } from 'history'
import { matchPath, useLocation } from 'react-router'
import { NavLinkProps } from 'react-router-dom'

type Params = Pick<NavLinkProps, 'to' | 'location' | 'exact' | 'strict' | 'isActive'>

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
    ? matchPath(currentLocation.pathname, {
        path: escapedPath,
        exact,
        sensitive: false,
        strict,
      })
    : null
  const isActive = !!(isActiveCb ? isActiveCb(match, currentLocation) : match)

  return isActive
}

function resolveToLocation(to: Params['to'], currentLocation: Params['location']) {
  return typeof to === 'function' ? to(currentLocation!) : to
}

function normalizeToLocation(to: string | LocationDescriptor<unknown>, currentLocation: Params['location']) {
  return typeof to === 'string' ? createLocation(to, null, undefined, currentLocation) : to
}
