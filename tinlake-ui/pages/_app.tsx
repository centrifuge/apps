import { AxisTheme } from '@centrifuge/axis-theme'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { createWrapper } from 'next-redux-wrapper'
import App from 'next/app'
import Head from 'next/head'
import React from 'react'
import { StyledApp } from '../components/StyledApp'
import config from '../config'
import makeStore from '../utils/makeStore'

require('regenerator-runtime/runtime')

if (config.enableErrorLogging) {
  Sentry.init({
    environment: config.network,
    dsn: 'https://2700a2b81fca4be481437bb77e9ea7f2@o464978.ingest.sentry.io/5476370',
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  })
}

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
          <script
            dangerouslySetInnerHTML={{
              __html: `var _paq = window._paq = window._paq || [];
              /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
              _paq.push(['trackPageView']);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="https://centrifuge.matomo.cloud/";
                _paq.push(['setTrackerUrl', u+'matomo.php']);
                _paq.push(['setSiteId', '2']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.type='text/javascript'; g.async=true; g.src='//cdn.matomo.cloud/centrifuge.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
              })();`,
            }}
          />
        </Head>
        {config.enableErrorLogging && (
          <Sentry.ErrorBoundary fallback={'An error has occured'}>
            <StyledApp />
            <Component {...pageProps} />
          </Sentry.ErrorBoundary>
        )}
        {!config.enableErrorLogging && (
          <>
            <StyledApp />
            <Component {...pageProps} />
          </>
        )}
      </AxisTheme>
    )
  }
}

const wrapper = createWrapper(makeStore, { debug: false })

export default wrapper.withRedux(MyApp)
