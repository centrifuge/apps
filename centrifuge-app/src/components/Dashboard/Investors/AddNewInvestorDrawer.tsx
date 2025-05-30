import { getChainInfo, useCentrifugeTransaction, useWallet } from '@centrifuge/centrifuge-react'
import { AddressInput, Box, Button, Drawer, Select, Stack, Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import { Form, FormikContextType, FormikErrors, FormikProvider, useFormik } from 'formik'
import { useState } from 'react'
import { isEvmAddress } from '../../../utils/address'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { useActiveDomains } from '../../../utils/useLiquidityPools'
import { useInvestorStatus, useSuitableAccounts } from '../../../utils/usePermissions'
import { usePoolMetadataMulti } from '../../../utils/usePools'

type AddNewInvestorDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

type NewInvestorFormValues = {
  trancheId: string
  investorAddress: string
  network: '' | number
}

export function AddNewInvestorDrawer({ isOpen, onClose }: AddNewInvestorDrawerProps) {
  const { pools } = useSelectedPools(true)
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const [poolId, setPoolId] = useState(pools?.[0]?.id ?? '')

  const [account] = useSuitableAccounts({ poolId, poolRole: ['InvestorAdmin'], proxyType: ['Invest'] })

  const { execute, isLoading: isTransactionPending } = useCentrifugeTransaction(
    'Add new investor',
    (cent) => cent.pools.updatePoolRoles
  )

  const pool = pools?.find((p) => p.id === poolId)

  const formik = useFormik<NewInvestorFormValues>({
    enableReinitialize: true,
    validateOnChange: true,
    initialValues: {
      trancheId: pool?.tranches[0].id ?? '',
      investorAddress: '',
      network: '',
    },
    onSubmit: (values) => {
      if (!centAddress || !validAddress) return
      const trancheId = values.trancheId
      const SevenDaysMs = 7 * 24 * 60 * 60 * 1000
      const SevenDaysFromNow = Math.floor((Date.now() + SevenDaysMs) / 1000)
      const OneHundredYearsFromNow = Math.floor(Date.now() / 1000 + 10 * 365 * 24 * 60 * 60)
      const domains = values.network ? [[values.network, validAddress]] : undefined
      const isAllowed = allowedTranches.includes(trancheId)

      if (isAllowed) {
        execute([poolId!, [], [[centAddress, { TrancheInvestor: [trancheId, SevenDaysFromNow, domains as any] }]]], {
          account,
        })
      } else {
        execute(
          [poolId!, [[centAddress, { TrancheInvestor: [trancheId, OneHundredYearsFromNow, domains as any] }]], []],
          {
            account,
          }
        )
      }
    },
    validate: (values) => {
      const errors: FormikErrors<NewInvestorFormValues> = {}
      const validator =
        Number(values.network) === 0 ? isAddress(values.investorAddress) : isEvmAddress(values.investorAddress)

      if (values.investorAddress && !validator) {
        errors.investorAddress = 'Invalid address'
      }

      return errors
    },
  })

  const { allowedTranches, centAddress, validAddress } = useInvestorStatus(
    poolId,
    formik.values.investorAddress,
    formik.values.network || 'centrifuge'
  )

  const addressAlreadyExists = allowedTranches.includes(formik.values.trancheId)

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="33%" innerPaddingTop={3} title="New investor">
      <Stack gap={4}>
        <FormikProvider value={formik}>
          <Form>
            <Box display="flex" flexDirection="column" height="85vh">
              <Stack gap={2} flex={1} overflow="auto">
                <Select
                  label="Select pool"
                  options={
                    pools?.map((pool) => ({
                      label: poolMetadata.find((p) =>
                        Object.keys(p.data?.tranches ?? {}).find((tId) => tId === pool.tranches[0].id)
                      )?.data?.pool?.name,
                      value: pool.id,
                    })) ?? []
                  }
                  id="poolId"
                  name="poolId"
                  value={poolId}
                  onChange={(event) => {
                    const poolId = event.target.value
                    setPoolId(poolId)
                    const trancheId = pool?.tranches[0].id
                    formik.setFieldValue('trancheId', trancheId)
                  }}
                />
                <Select
                  label="Select tranche token"
                  id="trancheId"
                  name="trancheId"
                  disabled={pool?.tranches.length! === 1}
                  value={formik.values.trancheId}
                  options={
                    pool?.tranches.map((t) => {
                      return {
                        label: t.currency.displayName,
                        value: t.id,
                      }
                    }) ?? []
                  }
                  onChange={(event) => formik.setFieldValue('trancheId', event.target.value)}
                />
                <AddressNetworkInput formik={formik} poolId={poolId} addressAlreadyExists={addressAlreadyExists} />
              </Stack>
              <Button
                type="submit"
                loading={isTransactionPending}
                disabled={
                  !!formik.errors.investorAddress ||
                  !formik.values.investorAddress ||
                  addressAlreadyExists ||
                  !validAddress
                }
              >
                Add new investor
              </Button>
            </Box>
          </Form>
        </FormikProvider>
      </Stack>
    </Drawer>
  )
}

function AddressNetworkInput({
  formik,
  poolId,
  addressAlreadyExists,
}: {
  formik: FormikContextType<NewInvestorFormValues>
  poolId: string
  addressAlreadyExists: boolean
}) {
  const {
    evm: { chains },
  } = useWallet()
  const { data: domains } = useActiveDomains(poolId)
  const deployedLpChains = domains?.filter((d) => d.isActive).map((d) => d.chainId) ?? []

  return (
    <Stack gap={2} backgroundColor="backgroundSecondary" borderRadius="10px" padding={2}>
      <AddressInput
        value={formik.values.investorAddress}
        id="investorAddress"
        name="investorAddress"
        label="Wallet address"
        placeholder="Type here..."
        onChange={formik.handleChange}
        errorMessage={formik.errors.investorAddress}
      />
      {addressAlreadyExists && (
        <Text variant="heading4" color="statusOk">
          Address already exists
        </Text>
      )}
      <Select
        label="Network*"
        id="network"
        name="network"
        options={[
          { value: '', label: 'Centrifuge' },
          ...deployedLpChains
            .map((chainId) => ({
              value: String(chainId),
              label: getChainInfo(chains, chainId).name,
            }))
            .filter((option) => option.label !== ''),
        ]}
        onChange={(event) => formik.setFieldValue('network', Number(event.target.value))}
        disabled={!deployedLpChains.length}
      />
    </Stack>
  )
}
