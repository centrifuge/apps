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
    const pageProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

    return { pageProps };
  }

  render() {
    const { Component, pageProps, store, router, router: { asPath } } = this.props;

    // Next.js currently does not allow trailing slash in a route, but Netlify appends trailing slashes. This is a
    // client side redirect in case trailing slash occurs. See https://github.com/zeit/next.js/issues/5214 for details
    if (pageProps.statusCode === 404 && asPath && asPath.length > 1) {
      const [path, query = ''] = asPath.split('?');
      if (path.endsWith('/')) {
        const asPathWithoutTrailingSlash = path.replace(/\/*$/gim, '') + (query ? `?${query}` : '');
        if (typeof window !== 'undefined') {
          router.replace(asPathWithoutTrailingSlash, undefined, { shallow: true })
          return null;
        }
      }
    }

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
