import * as React from 'react'
import { initTinlake } from '../../services/tinlake'
import { ITinlake } from '@centrifuge/tinlake-js'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'

interface Props {
  render: (tinlake: ITinlake | ITinlakeV3) => React.ReactElement
  version?: 2 | 3
  addresses?: {
    ROOT_CONTRACT: string
    ACTIONS: string
    PROXY_REGISTRY: string
    COLLATERAL_NFT: string
  }
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }
}

interface State {
  loading: boolean
}

class WithTinlake extends React.Component<Props, State> {
  state: State = { loading: true }
  tinlake: ITinlake | ITinlakeV3 | null = null
  isMounted = false
  componentDidMount() {
    this.isMounted = true
    this.init()
  }

  componentWillUnmount() {
    this.isMounted = false
  }

  init = async () => {
    const { version, addresses, contractConfig } = this.props

    this.tinlake = initTinlake({ version, addresses, contractConfig })
    if (this.isMounted) {
      this.setState({ loading: false })
    }
  }

  render() {
    if (this.state.loading || !this.tinlake) {
      return null
    }
    return this.props.render(this.tinlake)
  }
}

export default WithTinlake
