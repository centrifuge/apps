import { DisplayField } from '@centrifuge/axis-display-field'
import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading } from 'grommet'
import { FormNextLink } from 'grommet-icons'
import Link from 'next/link'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Card } from '../../components/Card'
import { LabeledValue } from '../../components/LabeledValue'
import { Stack } from '../../components/Layout'
import NumberDisplay from '../../components/NumberDisplay'
import { Row } from '../../components/PoolList'
import { Desc, EmptyParagraph, Header, HeaderCol, HeaderTitle } from '../../components/PoolList/styles'
import { Tooltip } from '../../components/Tooltip'
import { Value } from '../../components/Value'
import { IpfsPools, Pool } from '../../config'
import { getAddressLink } from '../../utils/etherscanLinkGenerator'
import { useAddress } from '../../utils/useAddress'
import { useMedia } from '../../utils/useMedia'
import { usePools } from '../../utils/usePools'
import { TokenBalance, usePortfolio } from '../../utils/usePortfolio'
import { investorTransactions } from './transactionList'

interface Props {
  ipfsPools: IpfsPools
}

const toNumber = (value: BN | undefined, decimals: number) => {
  return value ? parseInt(value.toString(), 10) / 10 ** decimals : 0
}

const Portfolio: React.FC<Props> = (props: Props) => {
  const pools = usePools()
  const connectedAddress = useSelector<any, string | null>((state) => state.auth.address)
  const address = useAddress()
  const portfolio = usePortfolio()
  const isMobile = useMedia({ below: 'medium' })

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

  const totalDropValue =
    portfolio.data?.tokenBalances.reduce((prev, tokenBalance) => {
      return tokenBalance.symbol.substr(-3) === 'DRP' ? prev.add(tokenBalance.value) : prev
    }, new BN(0)) || null

  const totalTinValue =
    portfolio.data?.tokenBalances.reduce((prev, tokenBalance) => {
      return tokenBalance.symbol.substr(-3) === 'TIN' ? prev.add(tokenBalance.value) : prev
    }, new BN(0)) || null

  const hasBalance = portfolio.data?.totalValue && !portfolio.data.totalValue.isZero()

  const dataColumns = [
    {
      header: 'Current Balance',
      cell: (tokenBalance: TokenBalance) => <Value value={toNumber(tokenBalance.balance, 18) || '-'} />,
    },
    {
      header: (
        <Tooltip underline title="Token prices for this overview are updated daily">
          Current Price
        </Tooltip>
      ),
      cell: (tokenBalance: TokenBalance) => (
        <Value
          value={
            <NumberDisplay
              precision={4}
              render={(v) => <>{v === '0' ? '-' : v}</>}
              value={baseToDisplay(tokenBalance.price, 27)}
            />
          }
        />
      ),
    },
    {
      header: 'Current Value',
      cell: (tokenBalance: TokenBalance) => (
        <Value
          value={toNumber(tokenBalance.value, 18) || '-'}
          unit={getPool(tokenBalance)?.pool.metadata.currencySymbol || 'DAI'}
        />
      ),
    },
  ]

  return (
    <Box margin={{ top: 'medium' }}>
      <Box margin={{ bottom: 'medium' }}>
        <Box direction="row" justify="between">
          <Box direction="row" align="center">
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
          {address && hasBalance && (
            <Box direction="row" align="center">
              <FormNextLink style={{ transform: 'rotate(90deg)', marginRight: '5px' }} />
              <Heading level={4} onClick={() => investorTransactions(address)} style={{ cursor: 'pointer' }}>
                Download transactions
              </Heading>
            </Box>
          )}
        </Box>
      </Box>
      <Box direction="row" gap="small" margin={{ bottom: 'large' }} justify="center">
        <Card width="256px" p="medium" mx="small">
          <LabeledValue
            variant="large"
            icon="/static/DROP_final.svg"
            value={totalDropValue && toNumber(totalDropValue, 18)}
            unit="DAI"
            label="Total DROP Value"
          />
        </Card>
        <Card width="256px" p="medium" mx="small">
          <LabeledValue
            variant="large"
            icon="/static/TIN_final.svg"
            value={totalTinValue && toNumber(totalTinValue, 18)}
            unit="DAI"
            label="Total TIN Value"
          />
        </Card>
      </Box>

      {hasBalance ? (
        <Stack gap="small">
          {!isMobile && (
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
          )}
          {portfolio.data?.tokenBalances
            .filter((tokenBalance) => !tokenBalance.balance.isZero())
            .sort((a, b) => parseFloat(b.value.sub(a.value).toString()))
            .map((tokenBalance) => {
              const pool = getPool(tokenBalance)
              return (
                <Link
                  href={pool ? `/pool/${pool.data.id}/${pool.pool.metadata.slug}/investments` : ''}
                  shallow
                  passHref
                  key={tokenBalance.id}
                >
                  <Row
                    row={tokenBalance}
                    columns={dataColumns}
                    isMobile={isMobile as boolean}
                    icon={
                      getPool(tokenBalance)?.pool.metadata.media![
                        tokenBalance.symbol.substr(-3) === 'DRP' ? 'drop' : 'tin'
                      ]
                    }
                    title={getPool(tokenBalance)?.pool.metadata.name}
                    type={tokenBalance.symbol}
                    as="a"
                    interactive
                  />
                </Link>
              )
            })}

          <Box margin={{ top: 'medium', left: 'auto', right: 'auto' }}>
            <Link href="/">
              {/* <Button label="Browse pools" secondary size="small" /> */}
              <Box direction="row" align="center">
                <FormNextLink style={{ marginRight: '5px' }} />
                <Heading level={4} style={{ cursor: 'pointer' }}>
                  Browse pools
                </Heading>
              </Box>
            </Link>
          </Box>
        </Stack>
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
