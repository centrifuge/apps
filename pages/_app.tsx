import React from 'react';
import { Provider } from 'react-redux';
import App, { Container } from 'next/app';
import withRedux from 'next-redux-wrapper';
import makeStore from '../utils/makeStore';
import { AxisTheme } from '@centrifuge/axis-theme';
import Auth from '../components/Auth';
import WithTinlake from '../components/WithTinlake';
import { StyledApp } from '../components/StyledApp';

class MyApp extends App<{ store: any }> {
  static async getInitialProps({ Component, ctx }: { Component: any, ctx: any }) {
    ctx.store.dispatch({ type: 'FOO', payload: 'foo2' });

    const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

    return { pageProps };
  }

  render() {
    const { Component, pageProps, store } = this.props;
    return (
      <AxisTheme full={true}>
        <StyledApp>
          <Container>
            <Provider store={store}>
              <WithTinlake render={tinlake =>
                <Auth tinlake={tinlake} render={() =>
                  <Component {...pageProps} />
                } />
              } />
            </Provider>
          </Container>
        </StyledApp>
      </AxisTheme >
    );
  }
}

export default withRedux(makeStore)(MyApp);
