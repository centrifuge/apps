import * as React from 'react'
import { useDispatch } from 'react-redux'
import config from '../../config'
import { load, useAuth } from '../../ducks/auth'
import { useDebugFlags } from '../DebugFlags'
import { useTinlake } from '../TinlakeProvider'
import WrongNetwork from '../WrongNetwork'

const Auth: React.FC = ({ children }) => {
  const debugAddress = useDebugFlags().address
  const tinlake = useTinlake()
  const auth = useAuth()
  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(load(tinlake, debugAddress))
  }, [])

  if (auth!.network !== config.network) {
    return <WrongNetwork expected={config.network} actual={auth!.network} />
  }

  return <>{children}</>
}

export default Auth
