import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import {
  getChainInfo,
  Network,
  useCentEvmChainId,
  useCentrifuge,
  useCentrifugeConsts,
  useCentrifugeTransaction,
  useCentrifugeUtils,
  useWallet,
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
  Select,
  Shelf,
  Stack,
  Tabs,
  TabsItem,
  Text,
} from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { isAddress as isEvmAddress } from 'ethers'
import { Field, FieldProps, Form, FormikProvider, useFormik } from 'formik'
import React, { useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { useLocation, useMatch, useNavigate } from 'react-router'
import { usePermissions } from 'src/utils/usePermissions'
import styled from 'styled-components'
import centrifugeLogo from '../../assets/images/logoCentrifuge.svg'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useEvmTransaction } from '../../utils/tinlake/useEvmTransaction'
import { useAddress } from '../../utils/useAddress'
import { useCFGTokenPrice, useDailyCFGPrice } from '../../utils/useCFGTokenPrice'
import { useActiveDomains, useLiquidityPools } from '../../utils/useLiquidityPools'
import { combine, max, positiveNumber, required } from '../../utils/validation'
import { truncate } from '../../utils/web3'
import { FilterOptions, PriceChart } from '../Charts/PriceChart'
import { LabelValueStack } from '../LabelValueStack'
import { LoadBoundary } from '../LoadBoundary'
import { Spinner } from '../Spinner'
import { Tooltips } from '../Tooltips'
import { Holding, useHoldings } from './Holdings'

type TransferTokensProps = {
  onClose: () => void
  isOpen: boolean
}

export function TransferTokensDrawer({ onClose, isOpen }: TransferTokensProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <LoadBoundary>
        <TransferTokensDrawerInner />
      </LoadBoundary>
    </Drawer>
  )
}

function TransferTokensDrawerInner() {
  const address = useAddress()
  const consts = useCentrifugeConsts()
  const tokens = useHoldings(address)
  const isPortfolioPage = useMatch('/portfolio')

  const { search } = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(search)
  const transferKey = params.get('receive') || params.get('send') || ''
  const isSend = !!params.get('send')
  const isNativeTransfer = transferKey.toLowerCase() === consts.chainSymbol.toLowerCase()

  function getHolding() {
    if (!transferKey) return null

    if (transferKey?.includes('.')) {
      const [poolId, trancheId] = transferKey.split('.')
      return tokens?.find((token) => token.poolId === poolId && token.trancheId === trancheId)
    } else {
      return tokens?.find((token) => token.currency.symbol === transferKey)
    }
  }

  const holding = getHolding()

  return holding ? (
    <Stack gap={3}>
      <Text textAlign="center" variant="heading2">
        {holding?.currency.symbol} Holdings
      </Text>
      <Shelf gap={3} alignItems="flex-start" justifyContent="flex-start">
        <LabelValueStack
          label="Position"
          value={formatBalanceAbbreviated(holding?.position || 0, holding?.currency.symbol, 2)}
        />
        <LabelValueStack
          label="Value"
          value={formatBalanceAbbreviated(holding?.position.mul(holding?.tokenPrice) ?? 0, 'USD', 2)}
        />
        <LabelValueStack
          label={isNativeTransfer ? <Tooltips type="cfgPrice" label={`${consts.chainSymbol} Price`} /> : 'Price'}
          value={formatBalance(holding?.tokenPrice || 0, 'USD', 4)}
        />
      </Shelf>
      {isPortfolioPage && (
        <Stack>
          <Tabs
            selectedIndex={isSend ? 0 : 1}
            onChange={(index) =>
              navigate({
                search: index === 0 ? `send=${transferKey}` : `receive=${transferKey}`,
              })
            }
          >
            <TabsItem>Send</TabsItem>
            <TabsItem>Receive</TabsItem>
          </Tabs>
          {isSend ? (
            <SendToken holding={holding} isNativeTransfer={isNativeTransfer} />
          ) : (
            <ReceiveToken address={address!} />
          )}
        </Stack>
      )}
      {isNativeTransfer && (
        <Stack gap={12}>
          <Text variant="heading4" color="textPrimary" fontWeight={600}>
            Price
          </Text>
          <Box borderColor="rgba(0,0,0,0.08)" borderWidth="1px" borderStyle="solid" borderRadius="2px" p="6px">
            <CFGPriceChart />
          </Box>
        </Stack>
      )}
    </Stack>
  ) : (
    <Spinner />
  )
}

type SendProps = {
  holding: Holding
  isNativeTransfer?: boolean
}

const SendToken = ({ holding, isNativeTransfer }: SendProps) => {
  const address = useAddress()
  const cent = useCentrifuge()
  const { data: domains } = useActiveDomains(holding.poolId)
  const activeDomains = domains?.filter((domain) => domain.hasDeployedLp) ?? []
  const {
    connectedNetwork,
    isEvmOnSubstrate,
    evm: { chains, chainId: connectedEvmChainId, getProvider },
  } = useWallet()

  const utils = useCentrifugeUtils()
  const centEvmChainId = useCentEvmChainId()

  const { execute: transfer, isLoading } = useCentrifugeTransaction(
    `Send ${holding.currency.symbol}`,
    (cent) => cent.tokens.transfer,
    {
      onSuccess: () => form.resetForm(),
    }
  )
  const { execute: evmTransfer, isLoading: evmIsLoading } = useEvmTransaction(
    `Send ${holding.currency.symbol}`,
    (cent) => cent.liquidityPools.transferTrancheTokens,
    {
      onSuccess: () => {
        form.resetForm()
        refetchAllowance()
      },
    }
  )

  const form = useFormik<{
    amount: Decimal | number | ''
    chain: number | ''
    recipientAddress: string
    isDisclaimerAgreed: boolean
  }>({
    initialValues: {
      amount: '',
      chain: '',
      recipientAddress: '',
      isDisclaimerAgreed: false,
    },
    validate(values) {
      const errors: Partial<{ amount: string; recipientAddress: string; isDisclaimerAgreed: string }> = {}
      const { chain, recipientAddress } = values
      const validator = chain ? isEvmAddress : isAddress
      const validAddress = validator(recipientAddress) ? recipientAddress : undefined
      if (!validAddress) {
        errors.recipientAddress = 'Invalid address'
      } else if (!isNativeTransfer && !allowedTranches.includes(holding.trancheId)) {
        errors.recipientAddress = 'Recipient is not allowed to receive this token'
      }
      if (!values.isDisclaimerAgreed && values.recipientAddress.startsWith('0x') && isNativeTransfer) {
        errors.isDisclaimerAgreed = 'Please read and accept the above'
      }
      return errors
    },
    onSubmit: (values, actions) => {
      let { recipientAddress, chain } = values
      if (isEvmAddress(recipientAddress) && chain === '') {
        recipientAddress = utils.evmToSubstrateAddress(recipientAddress, centEvmChainId!)
      }
      if (connectedNetwork === 'centrifuge' || isEvmOnSubstrate) {
        transfer([
          recipientAddress,
          holding.currency.key,
          CurrencyBalance.fromFloat(values.amount.toString(), holding.currency.decimals),
          chain === '' ? undefined : { evm: chain },
        ])
      } else {
        if (!liquidityPools?.[0]) return
        const amount = CurrencyBalance.fromFloat(values.amount || 0, holding.currency.decimals)
        const send = () =>
          evmTransfer([
            recipientAddress,
            amount,
            liquidityPools[0].lpAddress,
            liquidityPools[0].trancheTokenAddress,
            connectedEvmChainId!,
            chain === '' ? 'centrifuge' : { evm: chain },
          ])
        if (isEvmAndNeedsApprove) {
          executeApprove([
            send,
            liquidityPools[0].trancheTokenAddress,
            CurrencyBalance.fromFloat(values.amount || 0, holding.currency.decimals),
            connectedEvmChainId!,
          ])
        } else {
          send()
        }
      }
      actions.setSubmitting(false)
    },
  })

  const { data: liquidityPools } = useLiquidityPools(
    holding.poolId,
    holding.trancheId,
    !isEvmOnSubstrate ? connectedEvmChainId ?? -1 : -1 // typeof form.values.chain === 'number' ? form.values.chain :
  )

  const { allowedTranches } = useInvestorStatus(
    holding.poolId,
    form.values.recipientAddress,
    form.values.chain || 'centrifuge'
  )

  const { data: allowanceData, refetch: refetchAllowance } = useQuery(
    ['allowance', liquidityPools?.[0]?.trancheTokenAddress, connectedEvmChainId, address],
    () =>
      cent.liquidityPools.getCentrifugeRouterAllowance(
        [liquidityPools![0].trancheTokenAddress!, address!, connectedEvmChainId!],
        {
          rpcProvider: getProvider(connectedEvmChainId!),
        }
      ),
    {
      enabled:
        !!liquidityPools?.[0]?.trancheTokenAddress && !!connectedEvmChainId && !!address && isEvmAddress(address),
    }
  )

  const isEvmAndNeedsApprove =
    !!liquidityPools?.[0]?.trancheTokenAddress &&
    allowanceData &&
    allowanceData?.allowance?.toDecimal().lt(Dec(form.values.amount || 0))

  const { execute: executeApprove, isLoading: isApproving } = useEvmTransaction(
    `Send ${holding.currency.symbol}`,
    (cent) =>
      ([, ...args]: [cb: () => void, currencyAddress: string, amount: BN, chainId: number], options) =>
        cent.liquidityPools.approveForCurrency(args, options),
    {
      onSuccess: ([cb]) => {
        cb()
      },
    }
  )

  useEffect(() => {
    form.validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedTranches])

  return (
    <Stack px={2} py={4} backgroundColor="backgroundSecondary">
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="chain">
              {({ field, form, meta }: FieldProps) => (
                <Select
                  name="chain"
                  label="Destination"
                  value={field.value}
                  options={[
                    { value: '', label: 'Centrifuge' },
                    ...(activeDomains.map((domain) => ({
                      value: String(domain.chainId),
                      label: getChainInfo(chains, domain.chainId).name,
                    })) || []),
                  ]}
                  disabled={!activeDomains.length}
                  onChange={(event) => {
                    form.setFieldValue('chain', event.target.value === '' ? '' : Number(event.target.value))
                  }}
                  onBlur={field.onBlur}
                  errorMessage={meta.touched && meta.error ? meta.error : undefined}
                />
              )}
            </Field>
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
            <Field
              name="amount"
              validate={combine(
                positiveNumber('Amount must be greater than 0'),
                max(holding.position.toNumber(), 'Amount exceeds wallet balance'),
                required()
              )}
            >
              {({ field, meta, form }: FieldProps) => (
                <CurrencyInput
                  {...field}
                  id="amount"
                  size={0}
                  placeholder="0.00"
                  label="Amount"
                  onSetMax={isNativeTransfer ? undefined : async () => form.setFieldValue('amount', holding.position)}
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  currency={holding.currency.symbol || 'CFG'}
                  onChange={(value) => form.setFieldValue('amount', value)}
                  required
                />
              )}
            </Field>
            <Shelf pl={1}>
              <Text variant="label2">
                Wallet balance: {formatBalance(holding.position, holding.currency.symbol, 2)}
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
              <Button variant="primary" type="submit" loading={isLoading || evmIsLoading || isApproving}>
                {isEvmAndNeedsApprove ? 'Approve and send' : 'Send'}
              </Button>
            </Shelf>
          </Stack>
        </Form>
      </FormikProvider>
    </Stack>
  )
}

const ReceiveToken = ({ address }: { address: string }) => {
  const { connectedNetworkName } = useWallet()
  const utils = useCentrifugeUtils()
  const [copied, setCopied] = React.useState(false)
  const formattedAddr = utils.formatAddress(address)

  return (
    <Stack gap={2} px={1} py={2} backgroundColor="backgroundSecondary">
      <Stack gap={3}>
        <Text variant="interactive2" color="textSecondary">
          Your address on {connectedNetworkName}
        </Text>
        <Shelf gap={1}>
          <Button
            variant="tertiary"
            small
            onClick={() => {
              setTimeout(() => setCopied(true), 100)
              setTimeout(() => setCopied(false), 1100)
              copyToClipboard(formattedAddr)
            }}
            title="Copy to clipboard"
          >
            <Shelf gap={1} style={{ cursor: 'copy' }}>
              <Container>
                <Box as="img" src={centrifugeLogo} width="100%" height="100%" alt="" />
              </Container>
              {truncate(formattedAddr, 10, 10)}
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
  }, [tokenDayData?.data?.tokenDayDatas, currentCFGPrice])

  return <PriceChart data={data} currency="CFG" filter={filter} setFilter={setFilter} />
})

export function useInvestorStatus(poolId: string, address: string, network: Network = 'centrifuge') {
  const {
    substrate: { evmChainId: substrateEvmChainId },
  } = useWallet()
  const validator = typeof network === 'number' ? isEvmAddress : isAddress
  const validAddress = validator(address) ? address : undefined
  const utils = useCentrifugeUtils()
  const centAddress =
    validAddress && typeof network === 'number'
      ? utils.evmToSubstrateAddress(address, network)
      : substrateEvmChainId && isEvmAddress(address)
      ? utils.evmToSubstrateAddress(address, substrateEvmChainId)
      : validAddress
  const permissions = usePermissions(centAddress)

  const SevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const allowedTranches = useMemo(
    () =>
      Object.entries(permissions?.pools[poolId]?.tranches ?? {})
        .filter(([, t]) => new Date(t.permissionedTill).getTime() - Date.now() > SevenDaysMs)
        .map(([tid]) => tid),
    [permissions, poolId]
  )

  return { allowedTranches, permissions, centAddress, validAddress }
}
