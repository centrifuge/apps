import { Box, Heading } from 'grommet'
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
// import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
// import { Token } from 'graphql'
// import { UintBase } from '../../utils/ratios'
import { DisplayField } from '@centrifuge/axis-display-field'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import PoolTitle from '../../components/PoolTitle'

interface Props {
  ipfsPools: IpfsPools
}

// interface AssetClass {
//   name: string
//   balance: number
// }

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

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
        pool.addresses.JUNIOR_TOKEN === tokenBalance.token.id || pool.addresses.SENIOR_TOKEN === tokenBalance.token.id
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
      return tokenBalance.token.symbol.substr(-3) === 'DRP'
        ? prev.add(
            tokenBalance.balance
              .mul(getPool(tokenBalance)?.data['seniorTokenPrice'] || new BN(0))
              .div(new BN(10).pow(new BN(27)))
          )
        : prev
    }, new BN(0)) || new BN(0)

  const totalTinValue =
    portfolio.data?.reduce((prev: BN, tokenBalance: TokenBalance) => {
      return tokenBalance.token.symbol.substr(-3) === 'TIN'
        ? prev.add(
            tokenBalance.balance
              .mul(getPool(tokenBalance)?.data['juniorTokenPrice'] || new BN(0))
              .div(new BN(10).pow(new BN(27)))
          )
        : prev
    }, new BN(0)) || new BN(0)

  // const assetClasses: AssetClass[] =
  //   portfolio.data
  //     ?.filter((tokenBalance: TokenBalance) => !tokenBalance.balance.isZero())
  //     .reduce((prev: AssetClass[], tokenBalance: TokenBalance) => {
  //       const pool = getPool(tokenBalance)
  //       if (!pool) return prev

  //       return [
  //         ...prev,
  //         {
  //           name: pool.pool.metadata.asset,
  //           balance: parseFloat(tokenBalance.balance.div(UintBase).toString()),
  //         },
  //       ]
  //     }, [] as AssetClass[]) || []

  return (
    <Box margin={{ top: 'medium' }}>
      <Box margin={{ bottom: 'medium' }}>
        <Box direction="row" justify="between">
          <PoolTitle page="Investment Portfolio" return />
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
            <TokenLogo src={`/static/DAI.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(totalDropValue, 18)} precision={0} />
            </Value>{' '}
          </Cont>
          <MetricLabel>Total DROP Value (DAI)</MetricLabel>
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
            <TokenLogo src={`/static/DAI.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(totalTinValue, 18)} precision={0} />
            </Value>{' '}
          </Cont>
          <MetricLabel>Total TIN Value (DAI)</MetricLabel>
        </Box>
      </Box>

      {/* <Box width="256px" height="220px">
        <ResponsiveContainer>
          <PieChart>
            <Pie nameKey="name" dataKey="balance" data={assetClasses} fill="#8884d8" label>
              {assetClasses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </Box> */}

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
              <HeaderTitle>Current Price</HeaderTitle>
            </HeaderCol>
            <HeaderCol>
              <HeaderTitle>Current Value</HeaderTitle>
            </HeaderCol>
          </Header>
          {portfolio.data
            ?.filter((tokenBalance: TokenBalance) => !tokenBalance.balance.isZero())
            .map((tokenBalance: TokenBalance) => (
              <PoolRow key={tokenBalance.token.id} onClick={() => clickToken(tokenBalance)}>
                <Icon
                  src={
                    tokenBalance.token.symbol.substr(-3) === 'DRP' ? '/static/DROP_final.svg' : '/static/TIN_final.svg'
                  }
                />
                <Desc>
                  <Name>{tokenBalance.token.symbol}</Name>
                  <Type>{getPool(tokenBalance)?.pool.metadata.name}</Type>
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
                      getPool(tokenBalance)?.data[
                        tokenBalance.token.symbol.substr(-3) === 'DRP' ? 'seniorTokenPrice' : 'juniorTokenPrice'
                      ] || new BN(0),
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
                    value={baseToDisplay(
                      tokenBalance.balance
                        .mul(
                          getPool(tokenBalance)?.data[
                            tokenBalance.token.symbol.substr(-3) === 'TIN' ? 'juniorTokenPrice' : 'seniorTokenPrice'
                          ] || new BN(0)
                        )
                        .div(new BN(10).pow(new BN(27))),
                      18
                    )}
                  />
                </DataCol>
                {/* <DataCol>
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
                value={baseToDisplay(tokenBalance.supplyAmount, 18)}
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
                value={baseToDisplay(tokenBalance.pendingSupplyCurrency, 18)}
              />
            </DataCol> */}
              </PoolRow>
            ))}
        </>
      )}
      {portfolio.data?.filter((tokenBalance: TokenBalance) => !tokenBalance.balance.isZero()).length === 0 && (
        <Box elevation="small" round="xsmall" pad={'medium'} background="white">
          No token holdings found.
        </Box>
      )}
    </Box>
  )
}

const shorten = (addr: string, visibleChars: number) =>
  addr.substr(0, visibleChars) + '...' + addr.substr(addr.length - visibleChars)

export default Portfolio
