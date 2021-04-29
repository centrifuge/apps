import { ITinlake } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { connect } from 'react-redux'
import config from '../../config'
import { AuthState, load } from '../../ducks/auth'
import { useQueryDebugEthAddress } from '../../utils/useQueryDebugEthAddress'
import WrongNetwork from '../WrongNetwork'

interface Props {
  tinlake: ITinlake
  render: (auth?: AuthState) => JSX.Element
  auth?: AuthState
  load?: (tinlake: ITinlake, debugAddress: string | null) => Promise<void>
}

const Auth = ({ auth, load, render, tinlake }: Props): JSX.Element => {
  const debugAddress = useQueryDebugEthAddress()

  React.useEffect(() => {
    load!(tinlake, debugAddress)
  }, [])

  if (auth!.network !== config.network) {
    return <WrongNetwork expected={config.network} actual={auth!.network} />
  }

  return render(auth!)
}

export default connect((state) => state, { load })(Auth)
