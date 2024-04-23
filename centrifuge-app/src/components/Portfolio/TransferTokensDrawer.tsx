import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import {
  useBalances,
  useCentEvmChainId,
  useCentrifugeTransaction,
  useCentrifugeUtils,
} from '@centrifuge/centrifuge-react'
import {
  AddressInput,
  Box,
  Button,
  Checkbox,
  CurrencyInput,
  Drawer,
  IconCheckCircle,
  IconCopy,
  Shelf,
  Stack,
  Tabs,
  TabsItem,
  Text,
} from '@centrifuge/fabric'
import { isAddress as isEvmAddress } from '@ethersproject/address'
import { isAddress as isSubstrateAddress } from '@polkadot/util-crypto'
import Decimal from 'decimal.js-light'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React, { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useHistory, useLocation, useRouteMatch } from 'react-router'
import styled from 'styled-components'
import centrifugeLogo from '../../assets/images/logoCentrifuge.svg'
import { Dec } from '../../utils/Decimal'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useCFGTokenPrice, useDailyCFGPrice } from '../../utils/useCFGTokenPrice'
import { useTransactionFeeEstimate } from '../../utils/useTransactionFeeEstimate'
import { truncate } from '../../utils/web3'
import { FilterOptions, PriceChart } from '../Charts/PriceChart'
import { LabelValueStack } from '../LabelValueStack'
import { Tooltips } from '../Tooltips'

type TransferTokensProps = {
  address: string
  onClose: () => void
  isOpen: boolean
}

export const TransferTokensDrawer = ({ address, onClose, isOpen }: TransferTokensProps) => {
  const centBalances = useBalances(address)
  const CFGPrice = useCFGTokenPrice()
  const isPortfolioPage = useRouteMatch('/portfolio')
  const { search } = useLocation()
  const history = useHistory()
  const params = new URLSearchParams(search)
  const transferCurrencySymbol = params.get('receive') || params.get('send')
  const isNativeTransfer = transferCurrencySymbol?.toLowerCase() === centBalances?.native.currency.symbol.toLowerCase()
  const currency = useMemo(() => {
    if (isNativeTransfer && centBalances?.native) {
      return {
        ...centBalances.native,
        balance: new CurrencyBalance(
          centBalances?.native.balance.sub(centBalances.native.locked),
          centBalances.native.currency.decimals
        ),
      }
    }
    return centBalances?.currencies.find((token) => token.currency.symbol === transferCurrencySymbol)
  }, [centBalances, transferCurrencySymbol])

  const tokenPrice = isNativeTransfer ? CFGPrice : 1

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <Stack gap={3}>
        <Text textAlign="center" variant="heading2">
          {transferCurrencySymbol || 'CFG'} Holdings
        </Text>
        <Shelf gap={3} alignItems="flex-start" justifyContent="flex-start">
          <LabelValueStack
            label="Position"
            value={formatBalanceAbbreviated(currency?.balance || 0, currency?.currency.symbol, 2)}
          />
          <LabelValueStack
            label="Value"
            value={formatBalanceAbbreviated(currency?.balance.toDecimal().mul(tokenPrice || 0) || 0, 'USD', 2)}
          />
          <LabelValueStack
            label={
              isNativeTransfer ? (
                <Tooltips type="cfgPrice" label={`${currency?.currency.symbol || 'CFG'} Price`} />
              ) : (
                'Price'
              )
            }
            value={formatBalance(tokenPrice || 0, 'USD', 4)}
          />
        </Shelf>
        {isPortfolioPage && (
          <Stack>
            <Tabs
              selectedIndex={params.get('send') ? 0 : 1}
              onChange={(index) =>
                history.push({
                  search: index === 0 ? `send=${transferCurrencySymbol}` : `receive=${transferCurrencySymbol}`,
                })
              }
            >
              <TabsItem>Send</TabsItem>
              <TabsItem>Receive</TabsItem>
            </Tabs>
            {params.get('send') ? (
              <SendToken
                address={address}
                currency={currency as SendReceiveProps['currency']}
                isNativeTransfer={isNativeTransfer}
              />
            ) : (
              <ReceiveToken address={address} currency={currency as SendReceiveProps['currency']} />
            )}
          </Stack>
        )}
        {isNativeTransfer && (
          <Stack gap={12}>
            <Text variant="heading6" color="textPrimary" fontWeight={600}>
              Price
            </Text>
            <Box borderColor="rgba(0,0,0,0.08)" borderWidth="1px" borderStyle="solid" borderRadius="2px" p="6px">
              <CFGPriceChart />
            </Box>
          </Stack>
        )}
      </Stack>
    </Drawer>
  )
}

type SendReceiveProps = {
  address: string
  currency?: {
    balance: CurrencyBalance
    currency: { symbol: string; decimals: number; key: string | { ForeignAsset: number } }
  }
  isNativeTransfer?: boolean
}

const SendToken = ({ address, currency, isNativeTransfer }: SendReceiveProps) => {
  const utils = useCentrifugeUtils()
  const chainId = useCentEvmChainId()

  const { execute: transfer, isLoading } = useCentrifugeTransaction(
    `Send ${currency?.currency.symbol || 'CFG'}`,
    (cent) => cent.tokens.transfer,
    {
      onSuccess: () => form.resetForm(),
    }
  )

  const { txFee, execute: estimatedTxFee } = useTransactionFeeEstimate((cent) => cent.tokens.transfer)
  useQuery(
    ['paymentInfo', address],
    async () => {
      if (!currency) return
      await estimatedTxFee([
        address,
        currency?.currency.key,
        CurrencyBalance.fromFloat(currency.balance.toDecimal(), currency?.currency.decimals),
      ])
    },
    {
      enabled: !!address,
    }
  )

  const form = useFormik<{ amount: Decimal | undefined; recipientAddress: string; isDisclaimerAgreed: boolean }>({
    initialValues: {
      amount: undefined,
      recipientAddress: '',
      isDisclaimerAgreed: false,
    },
    validate(values) {
      const errors: Partial<{ amount: string; recipientAddress: string; isDisclaimerAgreed: string }> = {}
      if (!values.isDisclaimerAgreed && values.recipientAddress.startsWith('0x') && isNativeTransfer) {
        errors.isDisclaimerAgreed = 'Please read and accept the above'
      }
      if (values.amount && Dec(values.amount).gt(currency?.balance.toDecimal() || Dec(0))) {
        errors.amount = 'Amount exceeds wallet balance'
      }
      if (!values.amount || Dec(values.amount).lte(0)) {
        errors.amount = 'Amount must be greater than 0'
      }
      if (!(isSubstrateAddress(values.recipientAddress) || isEvmAddress(values.recipientAddress))) {
        errors.recipientAddress = 'Invalid address format'
      }

      return errors
    },
    onSubmit: (values, actions) => {
      if (typeof values.amount === 'undefined') {
        actions.setErrors({ amount: 'Amount must be greater than 0' })
      } else if (!currency) {
        actions.setErrors({ amount: 'Invalid currency' })
      } else {
        if (isEvmAddress(values.recipientAddress)) {
          values.recipientAddress = utils.evmToSubstrateAddress(values.recipientAddress, chainId || 2031)
        }
        transfer([
          values.recipientAddress,
          currency?.currency.key,
          CurrencyBalance.fromFloat(values.amount.toString(), currency?.currency.decimals),
        ])
      }
      actions.setSubmitting(false)
    },
  })

  return (
    <Stack px={2} py={4} backgroundColor="backgroundSecondary">
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="recipientAddress">
              {({ field, meta }: FieldProps) => {
                return (
                  <AddressInput
                    {...field}
                    label="Recipient address"
                    errorMessage={meta.touched ? meta.error : undefined}
                    disabled={isLoading}
                    placeholder="0x0A4..."
                    required
                  />
                )
              }}
            </Field>
            <Field name="amount">
              {({ field, meta, form }: FieldProps) => (
                <CurrencyInput
                  {...field}
                  id="amount"
                  size={0}
                  placeholder="0.00"
                  label="Amount"
                  onSetMax={async () => form.setFieldValue('amount', currency?.balance.toDecimal().sub(txFee || 0))}
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  currency={currency?.currency.symbol || 'CFG'}
                  onChange={(value) => form.setFieldValue('amount', value)}
                  required
                />
              )}
            </Field>
            <Shelf pl={1}>
              <Text variant="label2">
                Wallet balance: {formatBalance(currency?.balance || 0, currency?.currency.symbol, 2)}
              </Text>
            </Shelf>
            {form.values.recipientAddress.startsWith('0x') && isNativeTransfer && (
              <>
                <Shelf bg="statusCriticalBg" borderRadius="2px" py={2} px={3}>
                  <Text color="statusCritical" variant="body2">
                    Only use this page to transfer native CFG to Centrifuge. Transfers to addresses on other networks or
                    on exchanges could result in loss of funds. If you want to bridge native CFG to Ethereum, go to{' '}
                    <a
                      style={{ color: 'inherit', textDecoration: 'underline' }}
                      href="https://bridge.centrifuge.io"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      bridge.centrifuge.io
                    </a>
                    .
                  </Text>
                </Shelf>
                <Shelf>
                  <Field name="isDisclaimerAgreed">
                    {({ field, meta }: FieldProps) => (
                      <Checkbox
                        errorMessage={meta.touched ? meta.error : undefined}
                        label="I have read the above and understand the risk"
                        {...field}
                      />
                    )}
                  </Field>
                </Shelf>
              </>
            )}
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

const ReceiveToken = ({ address }: SendReceiveProps) => {
  const utils = useCentrifugeUtils()
  const [copied, setCopied] = React.useState(false)
  const centAddress = useMemo(
    () => (address && address.startsWith('0x') ? utils.formatAddress(address) : address),
    [address]
  )

  return (
    <Stack gap={2} px={1} py={2} backgroundColor="backgroundSecondary">
      <Stack gap={3}>
        <Text variant="interactive2" color="textSecondary">
          Your address on Centrifuge Chain
        </Text>
        <Shelf gap={1}>
          <Button
            variant="tertiary"
            small
            onClick={() => {
              setTimeout(() => setCopied(true), 100)
              setTimeout(() => setCopied(false), 1100)
              copyToClipboard(centAddress)
            }}
            title="Copy to clipboard"
          >
            <Shelf gap={1} style={{ cursor: 'copy' }}>
              <Container>
                <Box as="img" src={centrifugeLogo} width="100%" height="100%" alt="" />
              </Container>
              {truncate(centAddress, 10, 10)}
              {copied ? <IconCheckCircle size="16px" /> : <IconCopy size="16px" />}
            </Shelf>
          </Button>
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
    if (tokenData.length > 0) {
      tokenData.push({
        day: new Date(),
        price: currentCFGPrice || 0,
      })
    }
    return tokenData
  }, [tokenDayData, filter])

  return <PriceChart data={data} currency="CFG" filter={filter} setFilter={setFilter} />
})
