import React from 'react'
import App from 'next/app'
import { createWrapper } from 'next-redux-wrapper'
import makeStore from '../utils/makeStore'
import { AxisTheme } from '@centrifuge/axis-theme'
import { StyledApp } from '../components/StyledApp'
import Head from 'next/head'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'

require('regenerator-runtime/runtime')

Sentry.init({
  dsn: 'https://2700a2b81fca4be481437bb77e9ea7f2@o464978.ingest.sentry.io/5476370',
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
})

class MyApp extends App {
  static async getInitialProps({ Component, ctx }: { Component: any; ctx: any }) {
    const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {}

    return { pageProps }
  }

  render() {
    const { Component, pageProps } = this.props

    return (
      <AxisTheme full={true}>
        <Head>
          <meta name="viewport" content="width=900, initial-scale=1" />
          <title>Tinlake | Centrifuge | Decentralized Asset Financing</title>
        </Head>
        <Sentry.ErrorBoundary fallback={'An error has occured'}>
          <StyledApp />
          <Component {...pageProps} />
        </Sentry.ErrorBoundary>
      </AxisTheme>
    )
  }
}

const wrapper = createWrapper(makeStore, { debug: false })

export default wrapper.withRedux(MyApp)
