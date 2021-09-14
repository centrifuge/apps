import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import config from '../../config'
import { AuthState, load } from '../../ducks/auth'
import { useQueryDebugEthAddress } from '../../utils/useQueryDebugEthAddress'
import { useTinlake } from '../TinlakeProvider'
import WrongNetwork from '../WrongNetwork'

interface Props {
  render?: (auth: AuthState) => JSX.Element
}

const Auth: React.FC<Props> = ({ render, children }) => {
  const debugAddress = useQueryDebugEthAddress()
  const tinlake = useTinlake()
  const auth = useSelector<any, AuthState>((state) => state.auth)
  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(load(tinlake, debugAddress))
  }, [])

  if (auth!.network !== config.network) {
    return <WrongNetwork expected={config.network} actual={auth!.network} />
  }

  return render ? render(auth!) : <>{children}</>
}

export default Auth
