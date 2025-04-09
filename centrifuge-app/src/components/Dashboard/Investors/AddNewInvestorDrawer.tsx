import { evmToSubstrateAddress, Holder } from '@centrifuge/centrifuge-js'
import { getChainInfo, useCentrifugeTransaction, useWallet } from '@centrifuge/centrifuge-react'
import { AddressInput, Box, Button, Drawer, Select, Stack } from '@centrifuge/fabric'
import { isAddress } from 'ethers'
import { Form, FormikContextType, FormikProvider, useFormik } from 'formik'
import { useState } from 'react'
import { isEvmAddress } from '../../../utils/address'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { useActiveDomains } from '../../../utils/useLiquidityPools'
import { usePoolMetadataMulti } from '../../../utils/usePools'

type AddNewInvestorDrawerProps = {
  isOpen: boolean
  onClose: () => void
  investors: Holder[]
}

type NewInvestorFormValues = {
  poolId: string
  trancheId: string
  investorAddress: string
  network: string
}

export function AddNewInvestorDrawer({ isOpen, onClose, investors }: AddNewInvestorDrawerProps) {
  const { pools } = useSelectedPools(true)
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const [poolId, setPoolId] = useState(pools?.[0]?.id ?? '')

  const poolInvestors = investors?.filter((i) => i.poolId === poolId)
  const existingInvestorsAddresses = poolInvestors?.map((i) => i.accountId?.toLowerCase()) ?? []

  const { execute, isLoading: isTransactionPending } = useCentrifugeTransaction(
    'Add new investor',
    (cent) => cent.pools.updatePoolRoles
  )

  const validate = (values: NewInvestorFormValues) => {
    const errors: Partial<NewInvestorFormValues> = {}
    const convertedAddress = isEvmAddress(values.investorAddress)
      ? evmToSubstrateAddress(values.investorAddress, Number(values.network) || 1)
      : values.investorAddress
    if (existingInvestorsAddresses.includes(convertedAddress.toLowerCase())) {
      errors.investorAddress = 'Address already exists'
    }
    return errors
  }

  const formik = useFormik({
    initialValues: {
      trancheId: '',
      investorAddress: '',
      network: '',
    } as NewInvestorFormValues,
    onSubmit: (values) => {
      const SevenDaysMs = 7 * 24 * 60 * 60 * 1000
      const SevenDaysFromNow = Math.floor((Date.now() + SevenDaysMs) / 1000)
      const validator = typeof values.network === 'number' ? isEvmAddress : isAddress
      const validAddress = validator(values.investorAddress) ? values.investorAddress : undefined
      const domains = values.network ? [[values.network, validAddress]] : undefined

      execute([
        values.poolId,
        [[validAddress!, { TrancheInvestor: [values.trancheId, SevenDaysFromNow, domains as any] }]],
        [],
      ])
    },
    validate,
  })

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
                    const trancheId = pools?.find((pool) => pool.id === poolId)?.tranches[0].id
                    formik.setFieldValue('trancheId', trancheId)
                  }}
                />
                <Select
                  label="Select tranche token"
                  id="trancheId"
                  name="trancheId"
                  disabled={pools?.find((pool) => pool.id === poolId)?.tranches.length! === 1}
                  value={formik.values.trancheId}
                  options={
                    pools
                      ?.find((pool) => pool.id === poolId)
                      ?.tranches.map((t) => {
                        return {
                          label: t.currency.displayName,
                          value: t.id,
                        }
                      }) ?? []
                  }
                  onChange={(event) => formik.setFieldValue('trancheId', event.target.value)}
                />
                <AddressNetworkInput formik={formik} poolId={poolId} />
              </Stack>
              <Button
                type="submit"
                loading={isTransactionPending}
                disabled={!!formik.errors.investorAddress || !formik.values.investorAddress || !formik.values.network}
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

function AddressNetworkInput({ formik, poolId }: { formik: FormikContextType<NewInvestorFormValues>; poolId: string }) {
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
        onChange={(event) => formik.setFieldValue('investorAddress', event.target.value)}
        errorMessage={formik.errors.investorAddress}
      />
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
        onChange={(event) => formik.setFieldValue('network', event.target.value)}
      />
    </Stack>
  )
}
