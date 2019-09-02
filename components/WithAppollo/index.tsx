import * as React from 'react';
import { ApolloClient, appolloClient } from '../../services/appollo';

interface Props {
  render: (appolloClient: ApolloClient) => React.ReactElement;
}

class WithAppollo extends React.Component<Props> {
  appolloClient: ApolloClient | null = null;
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
    this.appolloClient = appolloClient;
  }

  render() {
    if (!this.appolloClient) { return null; }

    return this.props.render(this.appolloClient);
  }
}

export default WithAppollo;
