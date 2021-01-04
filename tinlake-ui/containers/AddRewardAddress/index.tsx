import { ITinlake } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import UpdateCentAddr from '../../components/UpdateCentAddress'
import { AuthState } from '../../ducks/auth'
import { loadCentAddr, setCentAddr, UserRewardsState } from '../../ducks/userRewards'

interface Props {
  tinlake: ITinlake
}

const AddRewardAddress: React.FC<Props> = ({ tinlake }: Props) => {
  const { centAddrState, centAddr } = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  const dispatch = useDispatch()

  const auth = useSelector<any, AuthState>((state: any) => state.auth)
  const { address } = auth

  React.useEffect(() => {
    if (address) {
      dispatch(loadCentAddr(address, tinlake))
    }
  }, [address])

  const onUpdateCentAddr = async (addr: string) => {
    await dispatch(setCentAddr(addr))
  }

  return (
    <div>
      <div>
        Your Centrifuge Chain Address:{' '}
        {centAddrState === 'loading' ? (
          'loading'
        ) : centAddrState === 'empty' ? (
          <UpdateCentAddr onUpdate={onUpdateCentAddr} />
        ) : (
          centAddr
        )}
      </div>
    </div>
  )
}

export default AddRewardAddress
