import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import styled from 'styled-components'
import PageTitle from '../../components/PageTitle'
import { Pool } from '../../config'
import { downloadCSV } from '../../utils/export'
import { usePool } from '../../utils/usePool'
import { csvName } from '../DataQuery/queries'
import EpochOverview from '../Investment/View/EpochOverview'
import Access from './Admins'
import AOMetrics from './AOMetrics'
import AuditLog from './AuditLog'
import Liquidity from './Liquidity'
import Memberlist from './Memberlist'
import Parameters from './Parameters'
import PoolStatus from './PoolStatus'
import Risk from './Risk'

interface Props {
  activePool: Pool
  tinlake: ITinlake
}

const PoolManagement: React.FC<Props> = (props: Props) => {
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)

  const router = useRouter()
  const isAdmin = poolData?.isPoolAdmin || 'admin' in router.query

  const [view, setView] = React.useState('Liquidity')

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
        <Box direction="row">
          <Menu>
            <MenuItem
              secondary={view === 'Liquidity'}
              plain={view !== 'Liquidity'}
              onClick={() => setView('Liquidity')}
              label="Liquidity"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Investors'}
              plain={view !== 'Investors'}
              onClick={() => setView('Investors')}
              label="Investors"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Risk'}
              plain={view !== 'Risk'}
              onClick={() => setView('Risk')}
              label="Risk"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Access'}
              plain={view !== 'Access'}
              onClick={() => setView('Access')}
              label="Access"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Parameters'}
              plain={view !== 'Parameters'}
              onClick={() => setView('Parameters')}
              label="Parameters"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Audit Log'}
              plain={view !== 'Audit Log'}
              onClick={() => setView('Audit Log')}
              label="Audit Log"
              size="small"
              focusIndicator={false}
            />
          </Menu>
          <Box width="100%">
            {view === 'Liquidity' && (
              <>
                <AOMetrics activePool={props.activePool} />
                <PoolStatus activePool={props.activePool} tinlake={props.tinlake} />

                {'export' in router.query && (
                  <div>
                    <Button primary onClick={exportData} label="Export pool data" />
                  </div>
                )}

                <Liquidity activePool={props.activePool} tinlake={props.tinlake} />

                <EpochOverview tinlake={props.tinlake} activePool={props.activePool} />
              </>
            )}

            {view === 'Investors' && <Memberlist tinlake={props.tinlake} />}

            {view === 'Risk' && <Risk tinlake={props.tinlake} />}

            {view === 'Parameters' && <Parameters tinlake={props.tinlake} />}

            {view === 'Access' && <Access tinlake={props.tinlake} />}

            {view === 'Audit Log' && <AuditLog tinlake={props.tinlake} />}
          </Box>
        </Box>
      )}

      {!isAdmin && <>You need to be a pool admin.</>}
    </Box>
  )
}

export default PoolManagement

const Menu = styled(Box)`
  margin: 4px 48px 0 0;
  width: 140px;
`

const MenuItem = styled(Button)`
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
  padding: 4px 20px;
  text-align: left;
  width: 140px;
  margin: 4px 0;
`
