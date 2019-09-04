import * as React from 'react';
import { ApolloClient, apolloClient } from '../../services/apollo';

interface Props {
  render: (apolloClient: ApolloClient) => React.ReactElement;
}

class WithApollo extends React.Component<Props> {
  apolloClient: ApolloClient | null = null;
  isMounted = false;

  componentWillMount() {
    this.init();
  }

  componentDidMount() {
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  init = () => {
    this.apolloClient = apolloClient;
  }

  render() {
    if (!this.apolloClient) { return null; }

    return this.props.render(this.apolloClient);
  }
}

export default WithApollo;
