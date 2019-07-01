import React from 'react';
import { Provider } from 'react-redux';
import App, { Container } from 'next/app';
import withRedux from 'next-redux-wrapper';
import makeStore from '../utils/makeStore';

class MyApp extends App<{ store: any }> {
  static async getInitialProps({ Component, ctx }: { Component: any, ctx: any }) {
    ctx.store.dispatch({ type: 'FOO', payload: 'foo2' });

    const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

    return { pageProps };
  }

  render() {
    const { Component, pageProps, store } = this.props;
    return (
      <Container>
        <Provider store={store}>
          <Component {...pageProps} />
        </Provider>
      </Container>
    );
  }
}

export default withRedux(makeStore)(MyApp);
