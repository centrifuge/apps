import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box } from 'grommet'
import styled from 'styled-components'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { toDynamicPrecision } from '../../utils/toDynamicPrecision'

export const RewardStripe = ({ unclaimed, children }: React.PropsWithChildren<{ unclaimed: BN | null }>) => (
  <Cont direction="row" pad={{ vertical: 'small', horizontal: 'medium' }}>
    <TokenLogo src="/static/rad-black.svg" />
    <Box>
      <Label>Claimable rewards</Label>
      <Number>{addThousandsSeparators(toDynamicPrecision(baseToDisplay(unclaimed || '0', 18)))} RAD</Number>
    </Box>
    {children}
  </Cont>
)

const Cont = styled(Box)`
  background: #fcba59;
  border-radius: 0 0 6px 6px;
`

const TokenLogo = styled.img`
  margin: 0 14px 0 0;
  width: 24px;
  height: 24px;
  position: relative;
  top: 12px;
`

const Label = styled.div`
  font-size: 10px;
  font-weight: 500;
  height: 14px;
  line-height: 14px;
`

const Number = styled.div`
  font-size: 20px;
  font-weight: 500;
  height: 32px;
  line-height: 32px;
`

export const Small = styled.small`
  font-size: 11px;
`
