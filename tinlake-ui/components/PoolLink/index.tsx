import Link from 'next/link'
import { useRouter } from 'next/router'
import { UrlObject } from 'url'
import config, { Pool } from '../../config'

interface Props {
  href: string | UrlObject
  as?: string | UrlObject
  configPools: Pool[]
}

// PoolLink allows navigation within the same pool (it pre-fixes the passed href by the root address)
export const PoolLink: React.FunctionComponent<Props> = ({ href, as, children, configPools }) => {
  const { root } = useRouter().query

  if (!root) {
    throw new Error('expected `root` to be in route query, but was not')
  }

  // if set, require as to be string if href is string, and require it to be UrlObject if as is UrlObject
  if (as !== undefined && typeof href !== typeof as) {
    throw new Error('as and href need to be the same type')
  }

  let poolHref: string | UrlObject = ''
  let poolAs: string | UrlObject = ''
  if (typeof href === 'string') {
    poolHref = getHref(root, href, configPools)
    poolAs = getAs(root, as || href, configPools)
  } else {
    poolHref = {
      ...href,
      pathname: getHref(root, href.pathname, configPools),
    }
    poolAs = {
      ...((as as UrlObject) || href),
      pathname: getAs(root, href.pathname, configPools),
    }
  }
  return (
    <Link href={poolHref} as={poolAs} shallow>
      {children}
    </Link>
  )
}

function getHref(rootOrSlug: string | string[], href: string | null | undefined | UrlObject, configPools: Pool[]): string {
  const pool = configPools.find(
    (p) => (rootOrSlug as string).toLowerCase() === p.addresses.ROOT_CONTRACT.toLowerCase()
  )
  if (pool) {
    return `/pool/[root]/[slug]${href}`
  }
  const upPool = config.upcomingPools.find((p) => (rootOrSlug as string) === p.metadata.slug)
  if (upPool) {
    return `/pool/[root]${href}`
  }

  throw new Error(`could not find root ${rootOrSlug} for href in pools or upcoming pools`)
}

function getAs(rootOrSlug: string | string[], as: string | null | undefined | UrlObject, configPools: Pool[]): string {
  const pool = configPools.find(
    (p) => (rootOrSlug as string).toLowerCase() === p.addresses.ROOT_CONTRACT.toLowerCase()
  )
  if (pool) {
    return `/pool/${rootOrSlug}/${pool.metadata.slug}${as}`
  }
  const upPool = config.upcomingPools.find((p) => rootOrSlug === p.metadata.slug)
  if (upPool) {
    return `/pool/${rootOrSlug}${as}`
  }

  throw new Error(`could not find root ${rootOrSlug} for as in pools or upcoming pools`)
}
