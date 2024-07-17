import { useMatch } from 'react-router-dom'

export const useBasePath = (defaultPath: string = ''): string => {
  const matchPools = useMatch({ path: '/pools', end: false })
  const matchIssuer = useMatch({ path: '/issuer', end: false })

  if (matchPools) {
    return matchPools.pathnameBase
  }

  if (matchIssuer) {
    return matchIssuer.pathnameBase
  }

  return defaultPath
}
