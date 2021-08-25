import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useSelector } from 'react-redux'
import PageTitle from '../../components/PageTitle'
import { Pool } from '../../config'
import { AuthState } from '../../ducks/auth'
import { downloadCSV } from '../../utils/export'
import { usePool } from '../../utils/usePool'
import { csvName } from '../DataQuery/queries'
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
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const router = useRouter()

  const isAdmin = poolData?.isPoolAdmin || 'admin' in router.query
  const canManageParameters = auth?.permissions?.canSetMinimumJuniorRatio

  const exportData = () => {
    if (!poolData) return

    const data: any[] = []
    Object.keys(poolData).forEach((key: string) => {
      const value = (poolData as any)[key]
      if (key === 'junior' || key === 'senior' || key === 'maker') {
        Object.keys(value).forEach((subKey: string) => {
          data.push([`${key}.${subKey}`, value[subKey].toString()])
        })
      } else {
        data.push([key, value.toString()])
      }
    })

    downloadCSV(data, csvName(props.activePool?.metadata.slug))
  }

  return (
    <Box margin={{ top: 'medium' }}>
      <PageTitle pool={props.activePool} page="Pool Management" />

      {isAdmin && (
        <>
          <AOMetrics activePool={props.activePool} />
          <PoolStatus activePool={props.activePool} tinlake={props.tinlake} />

          {'export' in router.query && (
            <div>
              <Button primary onClick={exportData} label="Export pool data" />
            </div>
          )}

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
