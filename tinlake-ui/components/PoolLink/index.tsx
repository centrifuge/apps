import Link from 'next/link'
import { useRouter } from 'next/router'
// import { UrlObject } from 'url'
// import config, { ipfsPools } from '../../config'
import React from 'react'

interface Props {
  href: string
  children: React.ReactNode
}

// PoolLink allows navigation within the same pool (it pre-fixes the passed href by the root address)
export const PoolLink: React.FC<Props> = ({ href, children }) => {
  const router = useRouter()

  let linkHref = ''
  const hrefWithoutStartSlash = href.substring(0, 1) === '/' ? href.substring(1) : href
  if (router.query.root) linkHref = `/pool/${router.query.root}/${router.query.slug}/${hrefWithoutStartSlash}`
  else linkHref = `/pool/${router.query.slug}/${href}`

  return (
    <Link href={linkHref} shallow>
      {children}
    </Link>
  )

  // if (!root) {
  //   throw new Error('expected `root` to be in route query, but was not')
  // }

  // // if set, require as to be string if href is string, and require it to be UrlObject if as is UrlObject
  // if (as !== undefined && typeof href !== typeof as) {
  //   throw new Error('as and href need to be the same type')
  // }

  // let poolHref: string | UrlObject = ''
  // let poolAs: string | UrlObject = ''
  // if (typeof href === 'string') {
  //   poolHref = getHref(root, href)
  //   poolAs = getAs(root, as || href)
  // } else {
  //   poolHref = {
  //     ...href,
  //     pathname: getHref(root, href.pathname),
  //   }
  //   poolAs = {
  //     ...((as as UrlObject) || href),
  //     pathname: getAs(root, href.pathname),
  //   }
  // }
  // return (
  //   ipfsPools && (
  //     <Link href={poolHref} as={poolAs} shallow>
  //       {children}
  //     </Link>
  //   )
  // )
}

// function getHref(rootOrSlug: string | string[], href: string | null | undefined | UrlObject): string {
//   console.log(config, 'GET HRED')
//   const pool = ipfsPools?.active.find(
//     (p) => (rootOrSlug as string).toLowerCase() === p.addresses.ROOT_CONTRACT.toLowerCase()
//   )
//   if (pool) {
//     return `/pool/[root]/[slug]${href}`
//   }
//   const upPool = ipfsPools?.upcoming.find((p) => (rootOrSlug as string) === p.metadata.slug)
//   if (upPool) {
//     return `/pool/[root]${href}`
//   }

//   throw new Error(`could not find root ${rootOrSlug} for href in pools or upcoming pools`)
// }

// function getAs(rootOrSlug: string | string[], as: string | null | undefined | UrlObject): string {
//   const pool = ipfsPools?.active.find(
//     (p) => (rootOrSlug as string).toLowerCase() === p.addresses.ROOT_CONTRACT.toLowerCase()
//   )
//   if (pool) {
//     return `/pool/${rootOrSlug}/${pool.metadata.slug}${as}`
//   }
//   const upPool = ipfsPools?.upcoming.find((p) => rootOrSlug === p.metadata.slug)
//   if (upPool) {
//     return `/pool/${rootOrSlug}${as}`
//   }

//   throw new Error(`could not find root ${rootOrSlug} for as in pools or upcoming pools`)
// }
