import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
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
import styled, { useTheme } from 'styled-components'
import ethereumLogo from '../../assets/images/ethereum.svg'
import centrifugeLogo from '../../assets/images/logoCentrifuge.svg'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useCFGTokenPrice } from '../../utils/useCFGTokenPrice'
import { LabelValueStack } from '../LabelValueStack'
import { Tooltips } from '../Tooltips'

type CFGHoldingsProps = {
  address: string
}

export const CFGTransfer = ({ address }: CFGHoldingsProps) => {
  const centBalances = useBalances(address)
  const [activeTab, setActiveTab] = React.useState(1)
  const utils = useCentrifugeUtils()
  const CFGPrice = useCFGTokenPrice()

  const centAddress = useMemo(
    () => (address && address.startsWith('0x') ? utils.formatAddress(address) : address),
    [address]
  )

  const evmAddress = useMemo(
    () => (address && address.startsWith('0x') ? address : utils.addressToHex(address)),
    [address]
  )
  return (
    <Stack gap={2}>
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
        <LabelValueStack label={<Tooltips type="cfgPrice" />} value={formatBalance(CFGPrice || 0, 'USD', 2)} />
      </Shelf>
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
    </Stack>
  )
}

type SendReceiveProps = { evmAddress: string; centAddress: string }

const SendCFG = ({ evmAddress, centAddress }: SendReceiveProps) => {
  const theme = useTheme()
  const centBalances = useBalances(centAddress)

  const { execute: transferCFG, isLoading } = useCentrifugeTransaction('Send CFG', (cent) => cent.tokens.transfer, {
    onSuccess: () => form.resetForm(),
  })

  const form = useFormik<{ amount: Decimal | undefined; recipientAddress: string }>({
    initialValues: {
      amount: undefined,
      recipientAddress: evmAddress || '',
    },
    enableReinitialize: true,
    validate(values) {
      const errors: Partial<{ amount: string; recipientAddress: string }> = {}
      if (values.amount && values.amount.gt(centBalances?.native.balance.toDecimal() || Dec(0))) {
        errors.amount = 'Amount exceeds wallet balance'
      }
      if (!values.amount || values.amount.lte(0)) {
        errors.amount = 'Amount must be greater than 0'
      }
      if (!isAddress(values.recipientAddress) || !isEvmAddress(values.recipientAddress)) {
        errors.recipientAddress = 'Invalid address format'
      }

      return errors
    },
    onSubmit: (values, actions) => {
      if (typeof values.amount !== 'undefined') {
        transferCFG([
          values.recipientAddress,
          'Native',
          new CurrencyBalance(values.amount.toString(), centBalances?.native.currency.decimals || 18),
        ])
      } else {
        actions.setErrors({ amount: 'Amount must be greater than 0' })
      }
      actions.setSubmitting(false)
    },
  })

  return (
    <Stack px={2} py={4} backgroundColor={theme.colors.backgroundSecondary}>
      <FormikProvider value={form}>
        <Form>
          <Stack gap="2">
            <Field name="recipientAddress">
              {({ field, meta, form }: FieldProps) => (
                <TextInput
                  {...field}
                  label="Recipient address"
                  errorMessage={meta.touched ? meta.error : undefined}
                  disabled={isLoading}
                  placeholder="0x"
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
  const theme = useTheme()
  return (
    <Stack gap={2} px={1} py={2} backgroundColor={theme.colors.backgroundSecondary}>
      <Stack gap={3}>
        <Text variant="interactive2" color={theme.colors.grayScale[800]}>
          Your addresses on Centrifuge Chain
        </Text>
        <Shelf gap={1}>
          <Container>
            <Box as="img" src={ethereumLogo} width="100%" height="100%" alt="" />
          </Container>
          <Text variant="label2" color={theme.colors.grayScale[800]}>
            Ethereum Address:{' '}
          </Text>
          <Text variant="label1" fontSize="12px" textDecoration="underline" color={theme.colors.grayScale[900]}>
            {truncate(evmAddress)}
          </Text>
          <IconButton onClick={() => copyToClipboard(evmAddress)} title="Copy address to clipboard">
            <IconCopy />
          </IconButton>
        </Shelf>
        <Shelf gap={1}>
          <Container>
            <Box as="img" src={centrifugeLogo} width="100%" height="100%" alt="" />
          </Container>
          <Text variant="label2" color={theme.colors.grayScale[800]}>
            Centrifuge Native Address:{' '}
          </Text>
          <Text variant="label1" fontSize="12px" textDecoration="underline" color={theme.colors.grayScale[900]}>
            {truncate(centAddress)}
          </Text>
          <IconButton onClick={() => copyToClipboard(centAddress)} title="Copy address to clipboard">
            <IconCopy />
          </IconButton>
        </Shelf>
      </Stack>
      <Shelf borderRadius="3px" alignItems="flex-start" backgroundColor="backgroundPrimary" p={1} gap={1}>
        <IconInfo size={16} />
        <Text variant="body3" color={theme.colors.grayScale[800]}>
          Use this Ethereum address only on Centrifuge Chain. Receiving CFG on another network on this address will
          result in loss of funds. Be sure to select the right network.
        </Text>
      </Shelf>
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
