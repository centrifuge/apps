import Link from 'next/link'
import { UrlObject } from 'url'
import { useRouter } from 'next/router'

interface Props {
  href: string | UrlObject
  as?: string | UrlObject
}

// PoolLink allows navigation within the same pool (it pre-fixes the passed href by the root address)
export const PoolLink: React.FunctionComponent<Props> = ({ href, as, children }) => {
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
    poolHref = `/[root]${href}`
    poolAs = `/${root}${as || href}`
  } else {
    poolHref = {
      ...href,
      pathname: `/[root]${href.pathname}`,
    }
    poolAs = {
      ...((as as UrlObject) || href),
      pathname: `/${root}${href.pathname}`,
    }
  }
  return (
    <Link href={poolHref} as={poolAs} shallow>
      {children}
    </Link>
  )
}
