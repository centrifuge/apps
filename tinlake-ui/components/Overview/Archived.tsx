import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import Link from 'next/link'
import * as React from 'react'
import { LoadingValue } from '../../components/LoadingValue/index'
import { ArchivedPool, ArchivedPoolData } from '../../config'
import { ExplainerCard } from '../../containers/Investment/View/styles'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { toPrecision } from '../../utils/toPrecision'

interface Props {
  selectedPool: ArchivedPool
}

const Archived: React.FC<Props> = (props: Props) => {
  const poolData: ArchivedPoolData = props.selectedPool.archivedValues
  const totalFinanced = poolData?.totalFinancedCurrency
  const totalFinancings = poolData?.financingsCount
  const seniorInterest = poolData?.seniorInterestRate

  return (
    <Box margin={{ bottom: 'large', top: 'medium' }}>
      <Heading level="4">Pool Overview of {props.selectedPool.metadata.name} </Heading>

      <Box direction="row" margin={{ bottom: 'large' }}>
        <Box basis={'1/3'}>
          <Box>
            <Heading level="5" margin={{ top: 'small', bottom: 'small' }}>
              Pool Details
            </Heading>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">Total Financed</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={totalFinanced !== undefined}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(totalFinanced || '0', 18), 0))} DAI
                    </LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Total Financings</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={totalFinancings !== undefined}>{totalFinancings}</LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">DROP APR</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={seniorInterest !== undefined}>
                      {toPrecision(feeToInterestRate(seniorInterest || '0'), 2)} %
                    </LoadingValue>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <ExplainerCard margin={{ top: 'large' }}>
              <Box margin={{ left: 'auto', right: 'auto' }}>
                This is an archived static pool based on a previous version of the smart contracts (v2). You can view
                details and use this pool in the legacy app.
                <Link href={poolData?.legacyLink || 'https://v2.tinlake.centrifuge.io/'}>
                  <a target="_blank">
                    <Button margin={{ top: 'medium' }} primary label="View Pool" fill={false} />
                  </a>
                </Link>
              </Box>
            </ExplainerCard>
          </Box>
        </Box>
        <Box basis={'2/3'} margin={{ top: '0', left: 'large' }}>
          <div>
            <Heading level="5" margin={{ top: 'small' }}>
              Asset Originator Details
            </Heading>
            <a href={props.selectedPool.metadata.website} target="_blank" rel="noreferrer">
              <img
                alt="pool-logo"
                src={props.selectedPool.metadata.media?.logo}
                style={{ maxHeight: '80px', maxWidth: '50%' }}
              />
            </a>

            <p>{props.selectedPool.metadata.description}</p>
          </div>
        </Box>
      </Box>
    </Box>
  )
}

export default Archived
