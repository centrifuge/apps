import { ContractAddresses, ITinlake } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { initTinlake } from '../../services/tinlake'

interface Props {
  render: (tinlake: ITinlake) => React.ReactElement
  version?: 2 | 3
  addresses?: ContractAddresses
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
  tinlake: ITinlake | null = null
  isMounted = false
  componentDidMount() {
    this.isMounted = true
    this.init()
  }

  componentWillUnmount() {
    this.isMounted = false
  }

  init = async () => {
    const { addresses, contractConfig } = this.props

    this.tinlake = initTinlake({ addresses, contractConfig })
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
