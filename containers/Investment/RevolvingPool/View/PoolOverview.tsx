import * as React from 'react'
import { Box, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { connect, useSelector } from 'react-redux'
import { loadPool, PoolDataV3, PoolState } from '../../../../ducks/pool'
import { toPrecision } from '../../../../utils/toPrecision'
import { addThousandsSeparators } from '../../../../utils/addThousandsSeparators'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'

import { TokenLogo } from './styles'

interface Props {}

const PoolOverview: React.FC<Props> = () => {
  const pool = useSelector<any, PoolState>((state) => state.pool)

  React.useEffect(() => console.log(pool), [pool])

  const poolValue =
    (pool.data !== null &&
      (pool.data as PoolDataV3).netAssetValue &&
      (pool.data as PoolDataV3).reserve &&
      (pool.data as PoolDataV3).netAssetValue.add((pool.data as PoolDataV3).reserve)) ||
    '0'
  const dropRate = (pool.data && pool.data.senior && pool.data.senior.interestRate) || '0'

  return (
    <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }}>
      {pool && pool.data && (
        <>
          <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
            <Heading level="5" margin={'0'}>
              Pool Value
            </Heading>
            <Heading level="4" margin={{ left: 'auto', top: '0', bottom: '0' }}>
              DAI {addThousandsSeparators(toPrecision(baseToDisplay(poolValue, 18), 2))}
            </Heading>
          </Box>

          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Current NAV</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  DAI{' '}
                  {addThousandsSeparators(toPrecision(baseToDisplay((pool.data as PoolDataV3).netAssetValue, 18), 2))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Current Reserve</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  DAI {addThousandsSeparators(toPrecision(baseToDisplay((pool.data as PoolDataV3).reserve, 18), 2))}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">Maximum Reserve Amount</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  DAI {addThousandsSeparators(toPrecision(baseToDisplay((pool.data as PoolDataV3).maxReserve, 18), 2))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Heading level="5" margin={{ bottom: 'small' }}>
            Assets
          </Heading>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell scope="row">Outstanding Volume</TableCell>
                <TableCell style={{ textAlign: 'end' }}>
                  DAI{' '}
                  {addThousandsSeparators(
                    toPrecision(baseToDisplay((pool.data as PoolDataV3).outstandingVolume, 18), 2)
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell scope="row">
                  <span>
                    <TokenLogo src={`../../../../static/DROP_final.svg`} />
                    DROP APR
                  </span>
                </TableCell>
                <TableCell style={{ textAlign: 'end' }}>{toPrecision(feeToInterestRate(dropRate), 2)} %</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  )
}

export default connect((state) => state, { loadPool })(PoolOverview)
