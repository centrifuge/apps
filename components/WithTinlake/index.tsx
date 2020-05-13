import * as React from 'react';
import { getTinlake } from '../../services/tinlake';

interface Props {
  render: (tinlake: any) => React.ReactElement;
}

interface State {
  loading: boolean;
}

class WithTinlake extends React.Component<Props, State> {
  state: State = { loading: true };
  tinlake: any |null = null;
  isMounted = false;
  componentDidMount() {
    this.init();
    this.isMounted = true;
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  init = async () => {
    this.tinlake = await getTinlake();
    if (this.isMounted) {
      this.setState({ loading: false });
    }
  }

  render() {
    if (this.state.loading || !this.tinlake) { return null; }
    return this.props.render(this.tinlake);
  }
}

export default WithTinlake;
