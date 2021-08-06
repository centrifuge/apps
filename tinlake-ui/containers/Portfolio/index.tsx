import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Heading } from 'grommet'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import NumberDisplay from '../../components/NumberDisplay'
import {
  Dash,
  DataCol,
  Desc,
  EmptyParagraph,
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
import { Cont, Label as MetricLabel, TokenLogo, Value } from '../../components/PoolsMetrics/styles'
import { Tooltip } from '../../components/Tooltip'
import { IpfsPools, Pool } from '../../config'
import { loadPools, PoolData, PoolsState } from '../../ducks/pools'
import { loadPortfolio, PortfolioState, TokenBalance } from '../../ducks/portfolio'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import { useQueryDebugEthAddress } from '../../utils/useQueryDebugEthAddress'

interface Props {
  ipfsPools: IpfsPools
}

const Portfolio: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const pools = useSelector<any, PoolsState>((state) => state.pools)
  const portfolio = useSelector<any, PortfolioState>((state) => state.portfolio)

  const connectedAddress = useSelector<any, string | null>((state) => state.auth.address)
  const address = useQueryDebugEthAddress() || connectedAddress

  React.useEffect(() => {
    dispatch(loadPools(props.ipfsPools))
    if (address) dispatch(loadPortfolio(address, props.ipfsPools))
  }, [])

  React.useEffect(() => {
    if (address) dispatch(loadPortfolio(address, props.ipfsPools))
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

    return { data, pool: ipfsPool }
  }

  const clickToken = (tokenBalance: TokenBalance) => {
    const pool = getPool(tokenBalance)
    if (!pool) return

    router.push('/pool/[root]/[slug]/investments', `/pool/${pool.data.id}/${pool.pool.metadata.slug}/investments`, {
      shallow: true,
    })
  }
  const totalDropValue =
    portfolio.data?.reduce((prev, tokenBalance) => {
      return tokenBalance.token.symbol.substr(-3) === 'DRP' ? prev.add(tokenBalance.totalValue) : prev
    }, new BN(0)) || new BN(0)

  const totalTinValue =
    portfolio.data?.reduce((prev, tokenBalance) => {
      return tokenBalance.token.symbol.substr(-3) === 'TIN' ? prev.add(tokenBalance.totalValue) : prev
    }, new BN(0)) || new BN(0)

  return (
    <Box margin={{ top: 'medium' }}>
      <Box margin={{ bottom: 'medium' }}>
        <Box direction="row" justify="between">
          <Box direction="row" align="center">
            <Icon src="/static/dai.svg" />
            <Heading level={2} size="20px">
              Portfolio
            </Heading>
          </Box>
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

      {portfolio.data?.filter((tokenBalance) => !tokenBalance.balanceAmount.isZero()).length > 0 && (
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
                <Tooltip underline title="Token prices for this overview are updated daily">
                  Current Price
                </Tooltip>
              </HeaderTitle>
            </HeaderCol>
            <HeaderCol>
              <HeaderTitle>Current Value</HeaderTitle>
            </HeaderCol>
          </Header>
          {portfolio.data
            ?.filter((tokenBalance) => !tokenBalance.balanceAmount.isZero())
            .sort((a, b) => parseFloat(b.totalValue.sub(a.totalValue).toString()))
            .map((tokenBalance) => (
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
                    value={baseToDisplay(tokenBalance.balanceAmount, 18)}
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
                    value={baseToDisplay(tokenBalance.price, 27)}
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
                          <Number>{v}</Number>{' '}
                          <Unit>{getPool(tokenBalance)?.pool.metadata.currencySymbol || 'DAI'}</Unit>
                        </>
                      )
                    }
                    value={baseToDisplay(tokenBalance.totalValue, 18)}
                  />
                </DataCol>
              </PoolRow>
            ))}

          <Box margin={{ top: 'medium', left: 'auto', right: 'auto' }}>
            <Link href="/">
              <Button label="Explore further investment opportunities" secondary size="small" />
            </Link>
          </Box>
        </>
      )}
      {portfolio.data?.filter((tokenBalance) => !tokenBalance.balanceAmount.isZero()).length === 0 && (
        <EmptyParagraph>
          You do not have any investments.
          <br />
          <Link href="/">
            <a style={{ color: 'inherit' }}>Browse pools to invest in</a>
          </Link>
        </EmptyParagraph>
      )}
    </Box>
  )
}

export default Portfolio
