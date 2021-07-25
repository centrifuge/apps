import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageTitle from '../../components/PageTitle'
import { Pool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { loadPool, PoolData, PoolState } from '../../ducks/pool'
import FundingNeeds from './FundingNeeds'
import Memberlist from './Memberlist'
import Parameters from './Parameters'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const PoolManagement: React.FC<Props> = (props: Props) => {
  const auth = useSelector<any, AuthState>((state) => state.auth)
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(loadPool(props.tinlake, props.activePool?.metadata.maker?.ilk))
  }, [props.tinlake.signer])

  const canManageParameters = auth?.permissions?.canSetMinimumJuniorRatio

  return (
    <Box margin={{ top: 'medium' }}>
      <PageTitle pool={props.activePool} page="Pool Management" />

      {poolData?.isPoolAdmin && (
        <>
          <FundingNeeds activePool={props.activePool} />

          <Heading level="4">Manage members</Heading>
          <Memberlist tinlake={props.tinlake} />

          {canManageParameters && (
            <>
              <Heading level="4">Update pool parameters</Heading>
              <Parameters tinlake={props.tinlake} />
            </>
          )}
        </>
      )}

      {!poolData?.isPoolAdmin && <>You need to be a pool admin.</>}
    </Box>
  )
}

export default PoolManagement
