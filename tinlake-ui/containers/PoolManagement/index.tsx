import { Box, Button } from 'grommet'
import * as React from 'react'
import styled from 'styled-components'
import { useDebugFlags } from '../../components/DebugFlags'
import { useTinlake } from '../../components/TinlakeProvider'
import { Pool } from '../../config'
import { usePool } from '../../utils/usePool'
import EpochOverview from '../Investment/View/EpochOverview'
import AdminLog from './AdminLog'
// import Access from './Admins'
import AOMetrics from './AOMetrics'
import DataExport from './DataExport'
import Liquidity from './Liquidity'
import Memberlist from './Memberlist'
import Parameters from './Parameters'
import PoolStatus from './PoolStatus'
import Risk from './Risk'

interface Props {
  activePool: Pool
}

const PoolManagement: React.FC<Props> = (props: Props) => {
  const tinlake = useTinlake()
  const { data: poolData } = usePool(tinlake.contractAddresses.ROOT_CONTRACT)

  const { showAdmin } = useDebugFlags()

  const isAdmin = showAdmin || poolData?.isPoolAdmin

  const [view, setView] = React.useState('Liquidity')

  return (
    <Box>
      {isAdmin && (
        <Box>
          <Menu direction="row">
            <MenuItem
              secondary={view === 'Liquidity'}
              plain
              color={view === 'Liquidity' ? 'selected' : undefined}
              onClick={() => setView('Liquidity')}
              label="Liquidity"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Investors'}
              plain
              color={view === 'Investors' ? 'selected' : undefined}
              onClick={() => setView('Investors')}
              label="Investors"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Risk'}
              plain
              color={view === 'Risk' ? 'selected' : undefined}
              onClick={() => setView('Risk')}
              label="Risk"
              size="small"
              focusIndicator={false}
            />
            {/* {poolData?.adminLevel && poolData.adminLevel >= 3 && (
              <MenuItem
                secondary={view === 'Access'}
                plain={view !== 'Access'}
                onClick={() => setView('Access')}
                label="Access"
                size="small"
                focusIndicator={false}
              />
            )} */}
            <MenuItem
              secondary={view === 'Parameters'}
              plain
              color={view === 'Parameters' ? 'selected' : undefined}
              onClick={() => setView('Parameters')}
              label="Parameters"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Admin Log'}
              plain
              color={view === 'Admin Log' ? 'selected' : undefined}
              onClick={() => setView('Admin Log')}
              label="Admin Log"
              size="small"
              focusIndicator={false}
            />
            <MenuItem
              secondary={view === 'Data Export'}
              plain
              color={view === 'Data Export' ? 'selected' : undefined}
              onClick={() => setView('Data Export')}
              label="Data Export"
              size="small"
              focusIndicator={false}
            />
          </Menu>
          <Box width="100%">
            {view === 'Liquidity' && (
              <>
                <AOMetrics activePool={props.activePool} />
                <PoolStatus activePool={props.activePool} />
                <Liquidity activePool={props.activePool} />
                <EpochOverview activePool={props.activePool} />
              </>
            )}

            {view === 'Investors' && <Memberlist activePool={props.activePool} />}

            {view === 'Risk' && <Risk tinlake={tinlake} activePool={props.activePool} />}

            {view === 'Parameters' && <Parameters />}

            {/* {view === 'Access' && <Access tinlake={tinlake} />} */}

            {view === 'Admin Log' && <AdminLog tinlake={tinlake} />}

            {view === 'Data Export' && <DataExport tinlake={tinlake} activePool={props.activePool} />}
          </Box>
        </Box>
      )}

      {!isAdmin && <>You need to be a pool admin.</>}
    </Box>
  )
}

export default PoolManagement

const Menu = styled(Box)`
  margin: 0 48px 24px 0;
`

const MenuItem = styled(Button)`
  font-size: 14px;
  font-weight: 500;
  padding: 0 12px;
  text-align: left;
  margin: 4px 0;
`
