import * as React from 'react'
import { Helmet } from 'react-helmet-async'
import { config } from '../config'

export function Head() {
  const network = config.network || 'centrifuge'

  return (
    <Helmet>
      <title>{network === 'centrifuge' ? 'Centrifuge App' : 'Altair App'}</title>
      <meta
        name="description"
        content="Centrifuge is the platform for onchain finance, providing the infrastructure to tokenize, manage, and invest into a complete, diversified portfolio of real-world assets."
      />
      <link rel="icon" href={`/${network}/favicon.ico`} />
      <link rel="apple-touch-icon" sizes="180x180" href={`/${network}/apple-touch-icon.png`} />
      <link rel="icon" type="image/png" sizes="32x32" href={`/${network}/favicon-32x32.png`} />
      <link rel="icon" type="image/png" sizes="16x16" href={`/${network}/favicon-16x16.png`} />
      <link rel="manifest" href={`/${network}/site.webmanifest`} />
      <link rel="mask-icon" href={`/${network}/safari-pinned-tab.svg`} color="#5bbad5" />
      <meta name="msapplication-config" content={`/${network}/browserconfig.xml`} />
      <meta name="msapplication-TileColor" content={network === 'centrifuge' ? '#1253FF' : '#FFC012'} />
      <meta name="theme-color" content="#ffffff" />
      {/* manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/ */}
      <link rel="manifest" href={`/${network}/manifest.json`} />
    </Helmet>
  )
}
