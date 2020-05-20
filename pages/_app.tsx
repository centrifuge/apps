import React from 'react';
import App from 'next/app';
import { createWrapper } from 'next-redux-wrapper';
import makeStore from '../utils/makeStore';
import { AxisTheme } from '@centrifuge/axis-theme';
import Auth from '../components/Auth';
import WithTinlake from '../components/WithTinlake';
import { StyledApp } from '../components/StyledApp';
import Footer from '../components/Footer';

class MyApp extends App {
  static async getInitialProps({ Component, ctx }: { Component: any, ctx: any }) {
    const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

    return { pageProps };
  }

  render() {
    const { Component, pageProps } = this.props;

    return (
      <AxisTheme full={true}>
        <StyledApp
        style={{
          minHeight: 'calc(100vh - 150px)'
        }}>
          <WithTinlake render={tinlake =>
            <Auth tinlake={tinlake} render={() =>
              <Component {...pageProps} />
            } />
          } />
        </StyledApp>
        <Footer/>
      </AxisTheme >
    );
  }
}

const wrapper = createWrapper(makeStore, { debug: false });

export default wrapper.withRedux(MyApp);
