import * as React from 'react'
import Alert from '../Alert'
import { getOnboard } from '../../services/onboard'

interface Props {
  expected: string
  actual: string
}

class WrongNetwork extends React.Component<Props> {
  componentDidMount() {
    getOnboard()?.walletCheck()
  }

  render() {
    const { expected, actual } = this.props

    return (
      <Alert type="error" margin="large">
        <h1 style={{ marginTop: 0 }}>Please Change Network to {expected}</h1>
        <p style={{ marginBottom: 0 }}>
          You are currently connected with {actual}. Please change your network to {expected} in order to use Tinlake.
        </p>
      </Alert>
    )
  }
}

export default WrongNetwork
