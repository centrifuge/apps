import { ITinlake } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { connect } from 'react-redux'
import config from '../../config'
import { AuthState, load } from '../../ducks/auth'
import WrongNetwork from '../WrongNetwork'

interface Props {
  tinlake: ITinlake
  render: (auth: AuthState) => React.ReactElement | null | false
  auth?: AuthState
  load?: (tinlake: ITinlake) => Promise<void>
}

class Auth extends React.Component<Props> {
  componentDidMount() {
    this.init()
  }

  init = async () => {
    const { tinlake, load } = this.props

    load!(tinlake)
  }

  render() {
    const { auth } = this.props

    if (auth!.network !== config.network) {
      return <WrongNetwork expected={config.network} actual={auth!.network} />
    }

    return this.props.render(auth!)
  }
}

export default connect((state) => state, { load })(Auth)
