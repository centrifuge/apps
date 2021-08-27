import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button, Heading } from 'grommet'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useSelector } from 'react-redux'
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
import { Tooltip } from '../../components/Tooltip'
import { ValueDisplay } from '../../components/ValueDisplay'
import { IpfsPools, Pool } from '../../config'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import { usePools } from '../../utils/usePools'
import { TokenBalance, usePortfolio } from '../../utils/usePortfolio'
import { useQueryDebugEthAddress } from '../../utils/useQueryDebugEthAddress'

interface Props {
  ipfsPools: IpfsPools
}

const Portfolio: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const pools = usePools()
  const connectedAddress = useSelector<any, string | null>((state) => state.auth.address)
  const address = useQueryDebugEthAddress() || connectedAddress
  const portfolio = usePortfolio(props.ipfsPools, address)

  const getPool = (tokenBalance: TokenBalance) => {
    const ipfsPool = props.ipfsPools.active.find((pool: Pool) => {
      return (
        pool.addresses.JUNIOR_TOKEN.toLowerCase() === tokenBalance.id.toLowerCase() ||
        pool.addresses.SENIOR_TOKEN.toLowerCase() === tokenBalance.id.toLowerCase()
      )
    })

    if (!ipfsPool) return undefined

    const data = pools.data?.pools.find((pool) => {
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
    portfolio.data?.tokenBalances.reduce((prev, tokenBalance) => {
      return tokenBalance.symbol.substr(-3) === 'DRP' ? prev.add(tokenBalance.value) : prev
    }, new BN(0)) || new BN(0)

  const totalTinValue =
    portfolio.data?.tokenBalances.reduce((prev, tokenBalance) => {
      return tokenBalance.symbol.substr(-3) === 'TIN' ? prev.add(tokenBalance.value) : prev
    }, new BN(0)) || new BN(0)

  const hasBalance = portfolio.data?.totalValue && !portfolio.data.totalValue.isZero()

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
          <ValueDisplay
            icon="/static/DROP_final.svg"
            value={<NumberDisplay value={baseToDisplay(totalDropValue, 18)} precision={0} />}
            unit="DAI"
            label="Total DROP Value"
          />
        </Box>
        <Box
          width="256px"
          pad="medium"
          elevation="small"
          round="xsmall"
          background="white"
          margin={{ horizontal: '16px' }}
        >
          <ValueDisplay
            icon="/static/TIN_final.svg"
            value={<NumberDisplay value={baseToDisplay(totalTinValue, 18)} precision={0} />}
            unit="DAI"
            label="Total TIN Value"
          />
        </Box>
      </Box>

      {hasBalance ? (
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
          {portfolio.data?.tokenBalances
            .filter((tokenBalance) => !tokenBalance.balance.isZero())
            .sort((a, b) => parseFloat(b.value.sub(a.value).toString()))
            .map((tokenBalance) => (
              <PoolRow key={tokenBalance.id} onClick={() => clickToken(tokenBalance)}>
                <Icon
                  src={
                    getPool(tokenBalance)?.pool.metadata.media![
                      tokenBalance.symbol.substr(-3) === 'DRP' ? 'drop' : 'tin'
                    ]
                  }
                />
                <Desc>
                  <Name>{getPool(tokenBalance)?.pool.metadata.name}</Name>
                  <Type>{tokenBalance.symbol}</Type>
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
                    value={baseToDisplay(tokenBalance.value, 18)}
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
      ) : (
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
