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
  HeaderSub,
  HeaderTitle,
  Icon,
  Label,
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

  const dropBalance = portfolio.data.reduce((prev: BN, tokenBalance: TokenBalance) => {
    return tokenBalance.token.symbol.substr(-3) === 'DRP' ? prev.add(tokenBalance.balance) : prev
  }, new BN(0))

  const tinBalance = portfolio.data.reduce((prev: BN, tokenBalance: TokenBalance) => {
    return tokenBalance.token.symbol.substr(-3) === 'TIN' ? prev.add(tokenBalance.balance) : prev
  }, new BN(0))

  return (
    <Box margin={{ top: 'large' }}>
      <Heading level="4">Portfolio of {address ? shorten(address, 4) : ''}</Heading>
      <Box direction="row" gap="large" margin={{ bottom: 'small' }} justify="center">
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
              <NumberDisplay value={baseToDisplay(dropBalance, 18)} precision={0} />
            </Value>{' '}
          </Cont>
          <MetricLabel>Total DROP Balance</MetricLabel>
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
              <NumberDisplay value={baseToDisplay(tinBalance, 18)} precision={0} />
            </Value>{' '}
          </Cont>
          <MetricLabel>Total TIN Balance</MetricLabel>
        </Box>
      </Box>

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
        {/* <HeaderCol>
          <HeaderTitle>Initial Investment (DAI)</HeaderTitle>
        </HeaderCol>
        <HeaderCol>
          <HeaderTitle>Pending Investment (DAI)</HeaderTitle>
        </HeaderCol> */}
      </Header>
      {portfolio.data
        ?.filter((tokenBalance: TokenBalance) => !tokenBalance.balance.isZero())
        .map((tokenBalance: TokenBalance) => (
          <PoolRow key={tokenBalance.token.id}>
            <Icon
              src={tokenBalance.token.symbol.substr(-3) === 'DRP' ? '/static/DROP_final.svg' : '/static/TIN_final.svg'}
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
    </Box>
  )
}

const shorten = (addr: string, visibleChars: number) =>
  addr.substr(0, visibleChars) + '...' + addr.substr(addr.length - visibleChars)

export default Portfolio
