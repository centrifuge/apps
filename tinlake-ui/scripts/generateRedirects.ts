import 'dotenv/config'
import fs from 'fs'
import fetch, { Headers, Request, Response } from 'node-fetch'
import path from 'path'
import { loadPoolsFromIPFS } from '../config'

if (!global.fetch) {
  // @ts-ignore
  global.fetch = fetch
  // @ts-ignore
  global.Headers = Headers
  // @ts-ignore
  global.Request = Request
  // @ts-ignore
  global.Response = Response
}

;(async () => {
  const pools = await loadPoolsFromIPFS()

  const allPools = pools.active

  const urlData = [
    ...allPools.map((p) => ({
      root: p.addresses.ROOT_CONTRACT,
      slug: p.metadata.slug,
    })),
    ...allPools.map((p) => ({
      root: p.addresses.ROOT_CONTRACT.toLowerCase(),
      slug: p.metadata.slug,
    })),
  ]

  const redirectsFileText = [
    // /[ID] -> /pool/[ID]/[SLUG]
    urlData.map(({ root, slug }) => `/${root} /pool/${root}/${slug} 301!`).join('\n'),

    // /pool/[ID]/* -> /pool/[ID]/[SLUG]/*
    // /pool/[ID] -> /pool/[ID]/[SLUG]
    urlData.map(({ root, slug }) => `/pool/${root}/* /pool/${root}/${slug}/:splat 301!`).join('\n'),

    // /pool/[SLUG] -> /pool/[ID]/[SLUG]
    urlData.map(({ root, slug }) => `/pool/${slug} /pool/${root}/${slug} 301!`).join('\n'),
  ].join('\n')

  fs.writeFileSync(path.resolve(__dirname, '../out/_redirects'), redirectsFileText, { encoding: 'utf8' })
})()
