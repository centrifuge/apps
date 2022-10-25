import * as React from 'react'
import { getOnboard } from '../../services/onboard'
import Alert from '../Alert'

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
      <Alert type="info" margin="large">
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>Change your network to {expected.toLowerCase()}</h2>
        <p style={{ marginBottom: 0 }}>
          You are currently connected with {actual.toLowerCase()}. Please change your network to{' '}
          {expected.toLowerCase()} in order to use Tinlake.
        </p>
      </Alert>
    )
  }
}

export default WrongNetwork
