import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PageTitle from '../../components/PageTitle'
import { Pool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { loadPool, PoolData, PoolState } from '../../ducks/pool'
import EpochOverview from '../Investment/View/EpochOverview'
import AOMetrics from './AOMetrics'
import Liquidity from './Liquidity'
import Memberlist from './Memberlist'
import Parameters from './Parameters'
import PoolStatus from './PoolStatus'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const PoolManagement: React.FC<Props> = (props: Props) => {
  const auth = useSelector<any, AuthState>((state) => state.auth)
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const router = useRouter()
  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(loadPool(props.tinlake, props.activePool?.metadata.maker?.ilk))
  }, [props.tinlake.signer])

  const canManageParameters = auth?.permissions?.canSetMinimumJuniorRatio

  const isAdmin = poolData?.isPoolAdmin || 'admin' in router.query

  return (
    <Box margin={{ top: 'medium' }}>
      <PageTitle pool={props.activePool} page="Pool Management" />

      {isAdmin && (
        <>
          <AOMetrics activePool={props.activePool} />
          <PoolStatus activePool={props.activePool} tinlake={props.tinlake} />

          <Heading level="4" margin={{ top: 'medium' }}>
            Liquidity Management
          </Heading>
          <Liquidity activePool={props.activePool} tinlake={props.tinlake} />

          <EpochOverview tinlake={props.tinlake} activePool={props.activePool} />

          <Heading level="4">Investor Whitelisting</Heading>
          <Memberlist tinlake={props.tinlake} />

          {canManageParameters && (
            <>
              <Heading level="4">Pool Parameters</Heading>
              <Parameters tinlake={props.tinlake} />
            </>
          )}
        </>
      )}

      {!isAdmin && <>You need to be a pool admin.</>}
    </Box>
  )
}

export default PoolManagement
