import { feeToInterestRate, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Anchor, Box, Button, Heading } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import config, { Pool } from '../../config'
import { ensureAuthed } from '../../ducks/auth'
import { PoolData, PoolState } from '../../ducks/pool'
import InvestAction from '../InvestAction'

interface Props {
  tinlake: ITinlake
  selectedPool: Pool
}

const useOnConnect = () => {
  const dispatch = useDispatch()
  const address = useSelector<any, string | null>((state) => state.auth.address)
  const [callback, setCallback] = React.useState(undefined as Function | undefined)

  React.useEffect(() => {
    if (callback !== undefined) {
      callback(address)
      setCallback(undefined)
    }
  }, [address])

  return (cb: (address: string) => void) => {
    if (address) {
      cb(address)
    }

    setCallback(cb)
    dispatch(ensureAuthed())
  }
}

const OverviewHeader: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const onConnect = useOnConnect()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const dropRate = poolData?.senior?.interestRate || undefined
  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined

  const invest = () => {
    if (address) {
      if (poolData?.senior?.inMemberlist || poolData?.junior?.inMemberlist) {
        router.push(
          `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/investments`
        )
      } else {
        router.push(
          `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/onboarding`
        )
      }
    } else {
      onConnect(async (addr: string) => {
        console.log(props)
        const inAMemberlist = (await props.tinlake.checkSeniorTokenMemberlist(addr))
          ? true
          : await props.tinlake.checkJuniorTokenMemberlist(addr)

        if (inAMemberlist) {
          router.push(
            `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/investments`
          )
        } else {
          router.push(
            `/pool/${props.selectedPool.addresses.ROOT_CONTRACT}/${props.selectedPool.metadata.slug}/onboarding`
          )
        }
      })
    }
  }

  return (
    <Box
      direction="row"
      justify="between"
      gap="medium"
      elevation="small"
      round="xsmall"
      pad="medium"
      background="white"
      margin={{ bottom: 'large' }}
    >
      <HeaderBox pad={{ top: '4px' }} width="340px">
        <Heading level="5">{props.selectedPool.metadata.asset}</Heading>
        <Type>Asset type</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '8px' }}>
        <Heading level="4">
          30 to 90
          <Unit>days</Unit>
        </Heading>
        <Type>Asset maturity</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '8px' }}>
        <Heading level="4">
          <TokenLogo src={`/static/DROP_final.svg`} />
          {toPrecision(feeToInterestRate(dropRate || '0'), 2)}
          <Unit>%</Unit>
        </Heading>
        <Type>DROP APR</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '8px' }} style={{ borderRight: 'none' }}>
        <Heading level="4">
          <TokenLogo src={`/static/DAI.svg`} />
          747,681
          <Unit>DAI</Unit>
        </Heading>
        <Type>Pool Value</Type>
      </HeaderBox>
      <HeaderBox pad={{ top: '15px' }} style={{ borderRight: 'none' }}>
        {'addresses' in props.selectedPool &&
        config.featureFlagNewOnboardingPools.includes(props.selectedPool.addresses.ROOT_CONTRACT) ? (
          <Anchor>
            <Button label="Invest" primary onClick={invest} />
          </Anchor>
        ) : (
          <InvestAction pool={props.selectedPool} />
        )}
      </HeaderBox>
    </Box>
  )
}

export default OverviewHeader

const HeaderBox = styled(Box)<{ width?: string }>`
  text-align: center;
  border-right: 1px solid #dadada;
  padding-right: 20px;
  width: ${(props) => props.width || '200px'};

  h3,
  h4,
  h5,
  h6 {
    margin: 4px;
  }
`

const Type = styled.div`
  font-weight: 500;
  font-size: 13px;
  line-height: 14px;
  color: #979797;
`

const TokenLogo = styled.img`
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 20px;
  height: 20px;
  position: relative;
  top: -2px;
`

const Unit = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 28px;
  margin-left: 4px;
  color: #333;
`

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}
