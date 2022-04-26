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
  const [ausdcBalance, setAusdcBalance] = useState<BN>()
  const [usdcBalance, setUsdcBalance] = useState<BN>()
  const address = useAddress()

  const ausdcBalanceFormatted = addThousandsSeparators(toPrecision(baseToDisplay(ausdcBalance || '0', 6), 4))

  const loadAusdcBalance = async () => {
    if (address) {
      const bal = await tinlake.getRwaMarketAUsdcBalance(address)
      setAusdcBalance(bal)
    }
  }

  const loadUsdcBalance = async () => {
    if (address) {
      const bal = await tinlake.getRwaMarketUsdcBalance(address)
      setUsdcBalance(bal)
    }
  }

  const deposit = async () => {
    const usdcValueBN = new BN(usdcValue)

    if (address && usdcBalance?.gte(usdcValueBN)) {
      console.log('calling depositRwaMarket', usdcValue, address)
      await tinlake.depositRwaMarket(usdcValue, address)
    }
  }

  useEffect(() => {
    loadAusdcBalance()
    loadUsdcBalance()
  }, [address])

  return (
    <Stack gap="24px">
      <Title>Invest</Title>
      <Shelf justifyContent="space-between">
        <BodyText>Your balance</BodyText>
        <BodyText>{ausdcBalanceFormatted} aUSDC</BodyText>
      </Shelf>
      <div>
        <TokenInput
          token={{ symbol: 'USDC', img: '/static/rwa/USDC.svg', decimals: 6, precision: 18 }}
          value={usdcValue}
          error={error || undefined}
          maxValue={usdcBalance}
          limitLabel="Your balance"
          onChange={(val: string) => {
            setUsdcValue(val)
          }}
          // disabled={disabled}
        />
      </div>
      <Shelf paddingTop="24px" gap="16px" justifyContent="flex-end">
        <Button label="Cancel" onClick={() => setUsdcValue('0')} />
        <Button primary label="Deposit" onClick={deposit} />
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
