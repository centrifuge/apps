import * as React from 'react';
import Tinlake from 'tinlake';
import { getTinlake } from '../../services/tinlake';

interface Props {
  render: (tinlake: Tinlake) => React.ReactElement;
}

class WithTinlake extends React.Component<Props> {
  state = { loading: true };
  tinlake: Tinlake|null = null;

  componentDidMount() {
    this.init();
  }

  init = async () => {
    this.tinlake = await getTinlake();

    this.setState({ loading: false });
  }

  render() {
    if (this.state.loading || !this.tinlake) { return null; }

    return this.props.render(this.tinlake);
  }
}

export default WithTinlake;
