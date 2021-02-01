import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { maybeLoadUserRewards, UserRewardsState } from '../../ducks/userRewards'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { toDynamicPrecision } from '../../utils/toDynamicPrecision'

export const WalletRewards = ({ address }: { address: string }) => {
  const dispatch = useDispatch()
  const userRewards = useSelector<any, UserRewardsState>((state: any) => state.userRewards)
  React.useEffect(() => {
    if (address) {
      dispatch(maybeLoadUserRewards(address))
    }
  }, [address])

  const router = useRouter()

  if (!userRewards.data) {
    return null
  }

  return (
    <Cont direction="row" pad={{ vertical: '10px', horizontal: '16px' }}>
      <TokenLogo src="/static/rad-black.svg" />
      <Box>
        <Label>Your rewards</Label>
        <Number>
          {addThousandsSeparators(toDynamicPrecision(baseToDisplay(userRewards.data?.totalEarnedRewards || '0', 18)))}{' '}
          RAD
        </Number>
      </Box>
      {router.route !== '/rewards' && (
        <Button secondary onClick={() => router.push('/rewards')} label="Claim RAD" margin={{ left: 'auto' }} />
      )}
    </Cont>
  )
}

const Cont = styled(Box)`
  background: #fcba59;
  border-radius: 0 0 8px 8px;
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
