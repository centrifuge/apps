import * as React from 'react'
import { Box, Heading, Button, Table, TableBody, TableRow, TableCell } from 'grommet'
import { Pool } from '../../../../config'

interface Props {
  pool: Pool
  tranche: 'senior' | 'junior'
}

type Screen = 'home' | 'invest' | 'redeem' | 'order'

const TrancheOverview: React.FC<Props> = (props: Props) => {
  const token = props.tranche === 'senior' ? 'DROP' : 'TIN'

  const [screen, setScreen] = React.useState<Screen>('home')

  return (
    <Box width="medium" pad="medium" background="white" elevation="small" gap="xsmall" margin="small">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row">{token} Balance</TableCell>
            <TableCell style={{ textAlign: 'end' }}> 1,502.24 </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Current Price</TableCell>
            <TableCell style={{ textAlign: 'end' }}> 1.232 </TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row">Your {token} Value</TableCell>
            <TableCell style={{ textAlign: 'end' }}>DAI 1321,523.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {screen === 'home' && (
        <Box gap="small" justify="end" direction="row" margin={{ top: 'small' }}>
          <Button primary label="Redeem" onClick={() => setScreen('redeem')} />
          <Button primary label="Invest" onClick={() => setScreen('invest')} />
        </Box>
      )}

      {screen === 'invest' && (
        <Box margin={{ left: 'auto' }}>
          <Button label="Cancel" onClick={() => setScreen('home')} />
          <Button primary label="Lock DAI" />
        </Box>
      )}

      {screen === 'redeem' && (
        <Box margin={{ left: 'auto' }}>
          <Button label="Cancel" onClick={() => setScreen('home')} />
          <Button primary label={`Lock ${token}`} />
        </Box>
      )}
    </Box>
  )
}

export default TrancheOverview
