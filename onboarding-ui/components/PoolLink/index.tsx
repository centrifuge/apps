import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import { UrlObject } from 'url'

interface Props {
  href: string | UrlObject
  children: React.ReactNode
  as?: string | UrlObject
}

// PoolLink allows navigation within the same pool (it pre-fixes the passed href by the root address)
export const PoolLink: React.FC<Props> = ({ href, as, children }) => {
  const router = useRouter()

  if (as !== undefined && typeof href !== typeof as) {
    throw new Error('as and href need to be the same type')
  }

  let poolHref: string | UrlObject = ''
  let poolAs: string | UrlObject = ''
  if (typeof href === 'string') {
    poolHref = getHref(router.query.root, href)
    poolAs = getAs(router.query.root, router.query.slug, as || href)
  } else {
    poolHref = {
      ...href,
      pathname: getHref(router.query.root, href.pathname),
    }
    poolAs = {
      ...((as as UrlObject) || href),
      pathname: getAs(router.query.root, router.query.slug, href.pathname),
    }
  }

  return (
    <Link href={poolHref} as={poolAs} shallow>
      {children}
    </Link>
  )
}

function getHref(root: string | string[] | undefined, href: string | null | undefined | UrlObject): string {
  if (root) {
    return `/pool/[root]/[slug]${href}`
  }
  return `/pool/[slug]${href}`
}

function getAs(
  root: string | string[] | undefined,
  slug: string | string[] | undefined,
  as: string | null | undefined | UrlObject
): string {
  if (slug) {
    return `/pool/${root}/${slug}${as}`
  }
  return `/pool/${root}${as}`
}
