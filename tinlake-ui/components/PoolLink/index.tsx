import Link from 'next/link'
import { useRouter } from 'next/router'
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
}
