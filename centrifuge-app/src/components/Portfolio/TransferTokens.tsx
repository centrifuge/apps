import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  CurrencyInput,
  IconButton,
  IconCopy,
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
import { useQuery } from 'react-query'
import { useRouteMatch } from 'react-router'
import styled from 'styled-components'
import centrifugeLogo from '../../assets/images/logoCentrifuge.svg'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useCFGTokenPrice, useDailyCFGPrice } from '../../utils/useCFGTokenPrice'
import { useTransactionFeeEstimate } from '../../utils/useTransactionFeeEstimate'
import { FilterOptions, PriceChart } from '../Charts/PriceChart'
import { LabelValueStack } from '../LabelValueStack'
import { Tooltips } from '../Tooltips'

type CFGHoldingsProps = {
  address: string
}

export const TransferTokens = ({ address }: CFGHoldingsProps) => {
  const centBalances = useBalances(address)
  const [activeTab, setActiveTab] = React.useState(0)
  const CFGPrice = useCFGTokenPrice()
  const isPortfolioPage = useRouteMatch('/portfolio')

  return (
    <Stack gap={3}>
      <Text textAlign="center" variant="heading2">
        {centBalances?.native.currency.symbol || 'CFG'} Holdings
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
        <LabelValueStack
          label={<Tooltips type="cfgPrice" label={`${centBalances?.native.currency.symbol || 'CFG'} Price`} />}
          value={formatBalance(CFGPrice || 0, 'USD', 4)}
        />
      </Shelf>
      {isPortfolioPage && (
        <Stack>
          <Tabs selectedIndex={activeTab} onChange={setActiveTab}>
            <TabsItem>Send</TabsItem>
            <TabsItem>Receive</TabsItem>
          </Tabs>
          {activeTab === 0 ? <SendCFG address={address} /> : <ReceiveCFG address={address} />}
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

type SendReceiveProps = { address: string }

const SendCFG = ({ address }: SendReceiveProps) => {
  const centBalances = useBalances(address)
  const utils = useCentrifugeUtils()

  const { execute: transferCFG, isLoading } = useCentrifugeTransaction(
    `Send ${centBalances?.native.currency.symbol || 'CFG'}`,
    (cent) => cent.tokens.transfer,
    {
      onSuccess: () => form.resetForm(),
    }
  )

  const { txFee, execute: estimatedTxFee } = useTransactionFeeEstimate((cent) => cent.tokens.transfer)
  useQuery(
    ['paymentInfo', address],
    async () => {
      await estimatedTxFee([
        address,
        'Native',
        CurrencyBalance.fromFloat(centBalances?.native.balance.toDecimal() || 1, 18),
      ])
    },
    {
      enabled: !!address,
    }
  )

  const form = useFormik<{ amount: Decimal | undefined; recipientAddress: string }>({
    initialValues: {
      amount: undefined,
      recipientAddress: '',
    },
    validate(values) {
      const errors: Partial<{ amount: string; recipientAddress: string }> = {}
      if (values.amount && Dec(values.amount).gt(centBalances?.native.balance.toDecimal() || Dec(0))) {
        errors.amount = 'Amount exceeds wallet balance'
      }
      if (!values.amount || Dec(values.amount).lte(0)) {
        errors.amount = 'Amount must be greater than 0'
      }
      if (!(isAddress(values.recipientAddress) || isEvmAddress(values.recipientAddress))) {
        errors.recipientAddress = 'Invalid address format'
      }

      return errors
    },
    onSubmit: (values, actions) => {
      if (typeof values.amount === 'undefined') {
        actions.setErrors({ amount: 'Amount must be greater than 0' })
      } else {
        if (isEvmAddress(values.recipientAddress)) {
          values.recipientAddress = utils.evmToSubstrateAddress(values.recipientAddress, 2000)
        }
        transferCFG([
          values.recipientAddress,
          'Native',
          CurrencyBalance.fromFloat(values.amount.toString(), centBalances?.native.currency.decimals || 18),
        ])
      }
      actions.setSubmitting(false)
    },
  })

  return (
    <Stack px={2} py={4} backgroundColor="backgroundTertiary">
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
                  placeholder="0x0A4..."
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
                  onSetMax={async () =>
                    form.setFieldValue('amount', centBalances?.native.balance.toDecimal().sub(txFee || 0))
                  }
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  currency={centBalances?.native?.currency.symbol}
                  onChange={(value) => form.setFieldValue('amount', value)}
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

const ReceiveCFG = ({ address }: SendReceiveProps) => {
  const utils = useCentrifugeUtils()
  const centAddress = useMemo(
    () => (address && address.startsWith('0x') ? utils.formatAddress(address) : address),
    [address]
  )

  return (
    <Stack gap={2} px={1} py={2} backgroundColor="backgroundTertiary">
      <Stack gap={3}>
        <Text variant="interactive2" color="textSecondary">
          Your address on Centrifuge Chain
        </Text>
        <Shelf gap={1}>
          <Container>
            <Box as="img" src={centrifugeLogo} width="100%" height="100%" alt="" />
          </Container>
          <Text variant="label2" color="textSecondary">
            Centrifuge native address:{' '}
          </Text>
          <Text variant="label1" fontSize="12px" textDecoration="underline" color="textPrimary">
            {truncate(centAddress)}
          </Text>
          <IconButton onClick={() => copyToClipboard(centAddress)} title="Copy address to clipboard">
            <IconCopy />
          </IconButton>
        </Shelf>
      </Stack>
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

const CFGPriceChart = React.memo(function CFGPriceChart() {
  const [filter, setFilter] = React.useState<FilterOptions>('YTD')
  const { data: tokenDayData } = useDailyCFGPrice(filter)
  const currentCFGPrice = useCFGTokenPrice()

  const data = React.useMemo(() => {
    const tokenData =
      (tokenDayData?.data?.tokenDayDatas as { date: number; priceUSD: string }[])?.map((entry) => {
        return {
          day: new Date(entry.date * 1000),
          price: parseFloat(entry.priceUSD),
        }
      }) || []
    tokenData.push({
      day: new Date(),
      price: currentCFGPrice || 0,
    })
    return tokenData
  }, [tokenDayData, filter])

  return <PriceChart data={data} currency="USD" filter={filter} setFilter={setFilter} />
})
