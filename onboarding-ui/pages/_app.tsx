import { AxisTheme } from '@centrifuge/axis-theme'
import * as Sentry from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { createWrapper } from 'next-redux-wrapper'
import App from 'next/app'
import Head from 'next/head'
import React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { DebugFlags } from '../components/DebugFlags'
import { StyledApp } from '../components/StyledApp'
import config from '../config'
import { theme } from '../theme'
import makeStore from '../utils/makeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // useErrorBoundary: true,
      staleTime: 5 * 60 * 1000,
    },
  },
})

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
      <QueryClientProvider client={queryClient}>
        <AxisTheme full={true} theme={theme}>
          <>
            <Head>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Tinlake | Centrifuge | Decentralized Asset Financing</title>
              {config.matomoSiteId && (
                <script
                  dangerouslySetInnerHTML={{
                    __html: `var _paq = window._paq = window._paq || [];
              /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
              _paq.push(['trackPageView']);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="https://centrifuge.matomo.cloud/";
                _paq.push(['setTrackerUrl', u+'matomo.php']);
                _paq.push(['setSiteId', '${config.matomoSiteId}']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.type='text/javascript'; g.async=true; g.src='//cdn.matomo.cloud/centrifuge.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
              })();`,
                  }}
                />
              )}
            </Head>
            <DebugFlags>
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
            </DebugFlags>
          </>
        </AxisTheme>
      </QueryClientProvider>
    )
  }
}

const wrapper = createWrapper(makeStore, { debug: false })

export default wrapper.withRedux(MyApp)
