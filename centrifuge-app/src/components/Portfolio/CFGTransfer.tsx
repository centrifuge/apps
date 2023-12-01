import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction, useCentrifugeUtils, useWallet } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  CurrencyInput,
  IconButton,
  IconCopy,
  IconInfo,
  Shelf,
  Stack,
  Tabs,
  TabsItem,
  Text,
  TextInput,
  truncate,
} from '@centrifuge/fabric'
import { isAddress as isEvmAddress } from '@ethersproject/address'
import { isAddress } from '@polkadot/util-crypto'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React, { useMemo } from 'react'
import { useRouteMatch } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'
import ethereumLogo from '../../assets/images/ethereum.svg'
import centrifugeLogo from '../../assets/images/logoCentrifuge.svg'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useCFGTokenPrice, useDailyCFGPrice } from '../../utils/useCFGTokenPrice'
import { CustomizedTooltip } from '../Charts/CustomChartElements'
import { LabelValueStack } from '../LabelValueStack'
import { Tooltips } from '../Tooltips'

type CFGHoldingsProps = {
  address: string
}

export const CFGTransfer = ({ address }: CFGHoldingsProps) => {
  const centBalances = useBalances(address)
  const [activeTab, setActiveTab] = React.useState(0)
  const utils = useCentrifugeUtils()
  const CFGPrice = useCFGTokenPrice()
  const isPortfolioPage = useRouteMatch('/portfolio')

  const centAddress = useMemo(
    () => (address && address.startsWith('0x') ? utils.formatAddress(address) : address),
    [address]
  )

  const evmAddress = useMemo(
    () => (address && address.startsWith('0x') ? address : utils.addressToHex(address)),
    [address]
  )
  return (
    <Stack gap={3}>
      <Text textAlign="center" variant="heading2">
        CFG Holdings
      </Text>
      <Shelf gap={3} alignItems="flex-start" justifyContent="flex-start">
        <LabelValueStack
          label="Position"
          value={formatBalanceAbbreviated(centBalances?.native.balance || 0, centBalances?.native.currency.symbol, 2)}
        />
        <LabelValueStack
          label="Value"
          value={formatBalanceAbbreviated(centBalances?.native.balance.toDecimal().mul(CFGPrice || 0) || 0, 'USD', 2)}
        />
        <LabelValueStack label={<Tooltips type="cfgPrice" />} value={formatBalance(CFGPrice || 0, 'USD', 4)} />
      </Shelf>
      {isPortfolioPage && (
        <Stack>
          <Tabs selectedIndex={activeTab} onChange={setActiveTab}>
            <TabsItem>Send</TabsItem>
            <TabsItem>Receive</TabsItem>
          </Tabs>
          {activeTab === 0 ? (
            <SendCFG centAddress={centAddress} evmAddress={evmAddress} />
          ) : (
            <ReceiveCFG centAddress={centAddress} evmAddress={evmAddress} />
          )}
        </Stack>
      )}
      <Stack gap={12}>
        <Text variant="heading6" color="textPrimary" fontWeight={600}>
          Price
        </Text>
        <Box borderColor="rgba(0,0,0,0.08)" borderWidth="1px" borderStyle="solid" borderRadius="2px" p="6px">
          <CFGPriceChart />
        </Box>
      </Stack>
    </Stack>
  )
}

type SendReceiveProps = { evmAddress: string; centAddress: string }

const SendCFG = ({ evmAddress, centAddress }: SendReceiveProps) => {
  const centBalances = useBalances(centAddress)
  const utils = useCentrifugeUtils()

  const { execute: transferCFG, isLoading } = useCentrifugeTransaction('Send CFG', (cent) => cent.tokens.transfer, {
    onSuccess: () => form.resetForm(),
  })

  const form = useFormik<{ amount: Decimal | undefined; recipientAddress: string }>({
    initialValues: {
      amount: undefined,
      recipientAddress: '',
    },
    validate(values) {
      const errors: Partial<{ amount: string; recipientAddress: string }> = {}
      if (values.amount && values.amount.gt(centBalances?.native.balance.toDecimal() || Dec(0))) {
        errors.amount = 'Amount exceeds wallet balance'
      }
      if (!values.amount || values.amount.lte(0)) {
        errors.amount = 'Amount must be greater than 0'
      }
      if (!(isAddress(values.recipientAddress) || isEvmAddress(values.recipientAddress))) {
        errors.recipientAddress = 'Invalid address format'
      }

      return errors
    },
    onSubmit: (values, actions) => {
      if (typeof values.amount !== 'undefined') {
        if (isEvmAddress(values.recipientAddress)) {
          values.recipientAddress = utils.evmToSubstrateAddress(values.recipientAddress, 2000)
        }
        transferCFG([
          values.recipientAddress,
          'Native',
          CurrencyBalance.fromFloat(values.amount.toString(), centBalances?.native.currency.decimals || 18),
        ])
      } else {
        actions.setErrors({ amount: 'Amount must be greater than 0' })
      }
      actions.setSubmitting(false)
    },
  })

  return (
    <Stack px={2} py={4} backgroundColor="grayScale.50">
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="recipientAddress">
              {({ field, meta }: FieldProps) => (
                <TextInput
                  {...field}
                  label="Recipient address"
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  placeholder="0x0abc... EVM or Substrate address)"
                  required
                />
              )}
            </Field>
            <Field name="amount">
              {({ field, meta, form }: FieldProps) => (
                <CurrencyInput
                  {...field}
                  variant="small"
                  size={0}
                  placeholder="0.00"
                  label="Amount"
                  onSetMax={() => form.setFieldValue('amount', centBalances?.native.balance.toDecimal())}
                  initialValue={form.values.amount || undefined}
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  currency={centBalances?.native?.currency.symbol}
                  onChange={(value) => form.setFieldValue('amount', Dec(value))}
                  required
                />
              )}
            </Field>
            <Shelf pl={1}>
              <Text variant="label2">
                Wallet balance:{' '}
                {formatBalance(centBalances?.native.balance || 0, centBalances?.native.currency.symbol, 2)}
              </Text>
            </Shelf>
            <Shelf>
              <Button variant="primary" type="submit" loading={isLoading} loadingMessage={'Confirming'}>
                Send
              </Button>
            </Shelf>
          </Stack>
        </Form>
      </FormikProvider>
    </Stack>
  )
}

const ReceiveCFG = ({ evmAddress, centAddress }: SendReceiveProps) => {
  const { isEvmOnSubstrate } = useWallet()
  return (
    <Stack gap={2} px={1} py={2} backgroundColor="grayScale.50">
      <Stack gap={3}>
        <Text variant="interactive2" color="grayScale.800">
          Your address{isEvmOnSubstrate ? 'es' : ''} on Centrifuge Chain
        </Text>
        {isEvmOnSubstrate && (
          <Shelf gap={1}>
            <Container>
              <Box as="img" src={ethereumLogo} width="100%" height="100%" alt="" />
            </Container>
            <Text variant="label2" color="grayScale.800">
              Ethereum Address:{' '}
            </Text>
            <Text variant="label1" fontSize="12px" textDecoration="underline" color="grayScale.900">
              {truncate(evmAddress)}
            </Text>
            <IconButton onClick={() => copyToClipboard(evmAddress)} title="Copy address to clipboard">
              <IconCopy />
            </IconButton>
          </Shelf>
        )}
        <Shelf gap={1}>
          <Container>
            <Box as="img" src={centrifugeLogo} width="100%" height="100%" alt="" />
          </Container>
          <Text variant="label2" color="grayScale.800">
            Centrifuge Native Address:{' '}
          </Text>
          <Text variant="label1" fontSize="12px" textDecoration="underline" color="grayScale.900">
            {truncate(centAddress)}
          </Text>
          <IconButton onClick={() => copyToClipboard(centAddress)} title="Copy address to clipboard">
            <IconCopy />
          </IconButton>
        </Shelf>
      </Stack>
      {isEvmOnSubstrate && (
        <Shelf borderRadius="3px" alignItems="flex-start" backgroundColor="backgroundPrimary" p={1} gap={1}>
          <IconInfo size={16} />
          <Text variant="body3" color="grayScale.800">
            Use this Ethereum address only on Centrifuge Chain. Receiving CFG on another network on this address will
            result in loss of funds. Be sure to select the right network.
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}

const Container = styled(Shelf)`
  position: relative;
  filter: ${({ theme }) => (theme.scheme === 'dark' ? 'invert()' : undefined)};
  img {
    object-fit: contain;
  }
  height: 16px;
  width: 16px;
`

const CFGPriceChart = () => {
  const theme = useTheme()
  const { data: tokenDayData } = useDailyCFGPrice()
  const currentCFGPrice = useCFGTokenPrice()
  const data =
    (tokenDayData?.data?.tokenDayDatas as { date: number; priceUSD: string }[])?.map((entry) => {
      return {
        day: new Date(entry.date * 1000),
        priceUSD: parseFloat(entry.priceUSD),
      }
    }) || []

  return (
    <Stack gap={0}>
      <Shelf gap={1}>
        {currentCFGPrice && <Text variant="body3">CFG - {currentCFGPrice.toFixed(2)} USD</Text>}
        {/* <Text variant="body3" color="statusOk">
          TODO: +20%
        </Text> */}
      </Shelf>
      <ResponsiveContainer width="100%" height="100%" minHeight="200px">
        <AreaChart data={data || []} margin={{ top: 18, left: -30 }}>
          <defs>
            <linearGradient id="colorCFGPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={'#626262'} stopOpacity={0.4} />
              <stop offset="95%" stopColor={'#908f8f'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            type="category"
            tickFormatter={(tick: number) => {
              return new Date(tick).toLocaleString('en-US', { month: 'short' })
            }}
            style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
            tickLine={false}
            allowDuplicatedCategory={false}
          />
          <YAxis
            tickCount={6}
            dataKey="priceUSD"
            tickLine={false}
            style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
            tickFormatter={(tick: number) => {
              return tick.toFixed(2)
            }}
            interval={'preserveStartEnd'}
          />
          <CartesianGrid stroke={theme.colors.borderSecondary} />
          <Tooltip content={<CustomizedTooltip currency={'USD'} precision={4} />} />
          <Area
            type="monotone"
            dataKey="priceUSD"
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#colorCFGPrice)"
            name="Price"
            activeDot={{ fill: '#908f8f' }}
            stroke="#908f8f"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Stack>
  )
}
