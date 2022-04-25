import { TokenInput } from '@centrifuge/axis-token-input'
import { addThousandsSeparators, baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useAddress } from '../../utils/useAddress'
import { Button } from '../Button'
import { Shelf, Stack } from '../Layout'
import { useTinlake } from '../TinlakeProvider'

export const Invest: React.FC = () => {
  const tinlake = useTinlake()
  const [usdcValue, setUsdcValue] = useState<string>('0')
  const [error] = useState<string>()
  const [balance, setBalance] = useState<BN>()
  const address = useAddress()

  const balanceFormatted = addThousandsSeparators(toPrecision(baseToDisplay(balance || '0', 6), 4))

  const loadBalance = async () => {
    if (address) {
      const bal = await tinlake.getRwaMarketAUsdcBalance(address)
      setBalance(bal)
    }
  }

  useEffect(() => {
    loadBalance()
  }, [address])

  return (
    <Stack gap="24px">
      <Title>Invest</Title>
      <Shelf justifyContent="space-between">
        <BodyText>Your balance</BodyText>
        <BodyText>{balanceFormatted} aUSDC</BodyText>
      </Shelf>
      <div>
        <TokenInput
          token={{ symbol: 'USDC', img: '/static/rwa/USDC.svg', decimals: 6, precision: 18 }}
          value={usdcValue}
          error={error || undefined}
          maxValue={balance}
          limitLabel="Your balance"
          onChange={(val: string) => {
            setUsdcValue(val)
          }}
          // disabled={disabled}
        />
      </div>
      <Shelf paddingTop="24px" gap="16px" justifyContent="flex-end">
        <Button label="Cancel" />
        <Button primary label="Deposit" />
      </Shelf>
    </Stack>
  )
}

const Title = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
`

const BodyText = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 19.25px;
`
