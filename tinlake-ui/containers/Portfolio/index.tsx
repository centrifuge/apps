import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadPortfolio, PortfolioState, TokenBalance } from '../../ducks/portfolio'
import {
  Dash,
  DataCol,
  Desc,
  Header,
  HeaderCol,
  HeaderTitle,
  Icon,
  Name,
  Number,
  PoolRow,
  Type,
  Unit,
} from '../../components/PoolList/styles'
import NumberDisplay from '../../components/NumberDisplay'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import { loadPools, PoolsState } from '../../ducks/pools'
import { IpfsPools, Pool } from '../../config'
import { PoolData } from '../../ducks/pools'
import BN from 'bn.js'
import { Cont, Label as MetricLabel, Value, TokenLogo } from '../../components/PoolsMetrics/styles'
import { DisplayField } from '@centrifuge/axis-display-field'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import PageTitle from '../../components/PageTitle'
import Link from 'next/link'
import { Tooltip as AxisTooltip } from '@centrifuge/axis-tooltip'

interface Props {
  ipfsPools: IpfsPools
}

const Portfolio: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const pools = useSelector<any, PoolsState>((state) => state.pools)
  const portfolio = useSelector<any, PortfolioState>((state) => state.portfolio)

  const connectedAddress = useSelector<any, string | null>((state) => state.auth.address)
  const address = 'address' in router.query ? (router.query.address as string) : connectedAddress

  React.useEffect(() => {
    dispatch(loadPools(props.ipfsPools))
    if (address) dispatch(loadPortfolio(address))
  }, [])

  React.useEffect(() => {
    if (address) dispatch(loadPortfolio(address))
  }, [address])

  const getPool = (tokenBalance: TokenBalance) => {
    const ipfsPool = props.ipfsPools.active.find((pool: Pool) => {
      return (
        pool.addresses.JUNIOR_TOKEN.toLowerCase() === tokenBalance.token.id.toLowerCase() ||
        pool.addresses.SENIOR_TOKEN.toLowerCase() === tokenBalance.token.id.toLowerCase()
      )
    })

    if (!ipfsPool) return undefined

    const data = pools.data?.pools.find((pool: PoolData) => {
      return pool.id === ipfsPool.addresses.ROOT_CONTRACT
    })

    if (!data) return undefined

    return { pool: ipfsPool, data }
  }

  const clickToken = (tokenBalance: TokenBalance) => {
    const pool = getPool(tokenBalance)
    if (!pool) return

    router.push('/pool/[root]/[slug]/investments', `/pool/${pool.data.id}/${pool.pool.metadata.slug}/investments`, {
      shallow: true,
    })
  }
  const totalDropValue =
    portfolio.data?.reduce((prev: BN, tokenBalance: TokenBalance) => {
      return tokenBalance.token.symbol.substr(-3) === 'DRP' ? prev.add(tokenBalance.value) : prev
    }, new BN(0)) || new BN(0)

  const totalTinValue =
    portfolio.data?.reduce((prev: BN, tokenBalance: TokenBalance) => {
      return tokenBalance.token.symbol.substr(-3) === 'TIN' ? prev.add(tokenBalance.value) : prev
    }, new BN(0)) || new BN(0)

  return (
    <Box margin={{ top: 'medium' }}>
      <Box margin={{ bottom: 'medium' }}>
        <Box direction="row" justify="between">
          <PageTitle page="My Investment Portfolio" return />
          {address && address !== connectedAddress && (
            <Box margin={{ top: 'medium' }}>
              <DisplayField
                copy={true}
                as={'span'}
                value={address}
                link={{
                  href: getAddressLink(address),
                  target: '_blank',
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
      <Box direction="row" gap="small" margin={{ bottom: 'large' }} justify="center">
        <Box
          width="256px"
          pad="medium"
          elevation="small"
          round="xsmall"
          background="white"
          margin={{ horizontal: '16px' }}
        >
          <Cont>
            <TokenLogo src={`/static/DROP_final.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(totalDropValue, 18)} precision={0} />
            </Value>{' '}
            <Unit>DAI</Unit>
          </Cont>
          <MetricLabel>Total DROP Value</MetricLabel>
        </Box>
        <Box
          width="256px"
          pad="medium"
          elevation="small"
          round="xsmall"
          background="white"
          margin={{ horizontal: '16px' }}
        >
          <Cont>
            <TokenLogo src={`/static/TIN_final.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(totalTinValue, 18)} precision={0} />
            </Value>{' '}
            <Unit>DAI</Unit>
          </Cont>
          <MetricLabel>Total TIN Value</MetricLabel>
        </Box>
      </Box>

      {portfolio.data?.filter((tokenBalance: TokenBalance) => !tokenBalance.balance.isZero()).length > 0 && (
        <>
          <Header>
            <Desc>
              <HeaderTitle>Token</HeaderTitle>
            </Desc>
            <HeaderCol>
              <HeaderTitle>Current Balance</HeaderTitle>
            </HeaderCol>
            <HeaderCol>
              <HeaderTitle>
                <AxisTooltip title="Token prices for this overview are updated daily">Current Price</AxisTooltip>
              </HeaderTitle>
            </HeaderCol>
            <HeaderCol>
              <HeaderTitle>Current Value</HeaderTitle>
            </HeaderCol>
          </Header>
          {portfolio.data
            ?.filter((tokenBalance: TokenBalance) => !tokenBalance.balance.isZero())
            .sort((a: TokenBalance, b: TokenBalance) => parseFloat(b.value.sub(a.value).toString()))
            .map((tokenBalance: TokenBalance) => (
              <PoolRow key={tokenBalance.token.id} onClick={() => clickToken(tokenBalance)}>
                <Icon
                  src={
                    getPool(tokenBalance)?.pool.metadata.media![
                      tokenBalance.token.symbol.substr(-3) === 'DRP' ? 'drop' : 'tin'
                    ]
                  }
                />
                <Desc>
                  <Name>{getPool(tokenBalance)?.pool.metadata.name}</Name>
                  <Type>{tokenBalance.token.symbol}</Type>
                </Desc>
                <DataCol>
                  <NumberDisplay
                    precision={0}
                    render={(v) =>
                      v === '0' ? (
                        <Dash>-</Dash>
                      ) : (
                        <>
                          <Number>{v}</Number>
                        </>
                      )
                    }
                    value={baseToDisplay(tokenBalance.balance, 18)}
                  />
                </DataCol>

                <DataCol>
                  <NumberDisplay
                    precision={4}
                    render={(v) =>
                      v === '0' ? (
                        <Dash>-</Dash>
                      ) : (
                        <>
                          <Number>{v}</Number>
                        </>
                      )
                    }
                    value={baseToDisplay(
                      tokenBalance.value
                        .mul(new BN(10).pow(new BN(7)))
                        .div(tokenBalance.balance)
                        .mul(new BN(10).pow(new BN(20))),
                      27
                    )}
                  />
                </DataCol>

                <DataCol>
                  <NumberDisplay
                    precision={0}
                    render={(v) =>
                      v === '0' ? (
                        <Dash>-</Dash>
                      ) : (
                        <>
                          <Number>{v}</Number> <Unit>DAI</Unit>
                        </>
                      )
                    }
                    value={baseToDisplay(tokenBalance.value, 18)}
                  />
                </DataCol>
              </PoolRow>
            ))}

          <Box margin={{ top: 'medium', left: 'auto', right: 'auto' }}>
            <Link href="/">
              <Button label="Explore more investment opportunities" secondary size="small" />
            </Link>
          </Box>
        </>
      )}
      {portfolio.data?.filter((tokenBalance: TokenBalance) => !tokenBalance.balance.isZero()).length === 0 && (
        <>
          <Box elevation="small" round="xsmall" pad={'medium'} background="white">
            No token holdings found.
          </Box>

          <Box margin={{ top: 'medium', left: 'auto', right: 'auto' }}>
            <Link href="/">
              <Button label="Explore investment opportunities" secondary size="small" />
            </Link>
          </Box>
        </>
      )}
    </Box>
  )
}

export default Portfolio
