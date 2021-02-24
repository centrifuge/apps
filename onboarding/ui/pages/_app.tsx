import { AxisTheme } from '@centrifuge/axis-theme'
import App from 'next/app'
import Head from 'next/head'
import React from 'react'
import { StyledApp } from '../components/StyledApp'
const countries = require('i18n-iso-countries')

require('regenerator-runtime/runtime')

countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

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
          <title>Tinlake Investor Onboarding</title>
        </Head>
        <StyledApp />
        <Component {...pageProps} />
      </AxisTheme>
    )
  }
}

export default MyApp
