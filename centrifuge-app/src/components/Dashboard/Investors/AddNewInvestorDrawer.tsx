import { getChainInfo, useCentrifugeTransaction, useWallet } from '@centrifuge/centrifuge-react'
import { AddressInput, Button, Drawer, Select, Stack, Text } from '@centrifuge/fabric'
import { isAddress } from 'ethers'
import { Form, FormikContextType, FormikProvider, useFormik } from 'formik'
import { isEvmAddress } from '../../../utils/address'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { useActiveDomains } from '../../../utils/useLiquidityPools'
import { usePoolMetadataMulti } from '../../../utils/usePools'

type AddNewInvestorDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

export function AddNewInvestorDrawer({ isOpen, onClose }: AddNewInvestorDrawerProps) {
  const { pools } = useSelectedPools(true)
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const { execute, isLoading: isTransactionPending } = useCentrifugeTransaction(
    'Add new investor',
    (cent) => cent.pools.updatePoolRoles
  )

  const formik = useFormik({
    initialValues: {
      poolId: pools?.[0]?.id ?? '',
      trancheId: '',
      investorAddress: '',
      network: '',
    },
    onSubmit: (values) => {
      console.log(values)
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
  })
  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="33%" innerPaddingTop={3}>
      <Stack gap={4}>
        <Text variant="heading2" fontWeight="600" fontSize="20px">
          New Investor
        </Text>
        <FormikProvider value={formik}>
          <Form>
            <Stack gap={4}>
              <Stack gap={2}>
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
                  value={formik.values.poolId}
                  onChange={(event) => {
                    const poolId = event.target.value
                    const trancheId = pools?.find((pool) => pool.id === poolId)?.tranches[0].id
                    formik.setFieldValue('poolId', poolId)
                    formik.setFieldValue('trancheId', trancheId)
                  }}
                />

                <Select
                  label="Select tranche token"
                  id="trancheId"
                  name="trancheId"
                  disabled={pools?.find((pool) => pool.id === formik.values.poolId)?.tranches.length! === 1}
                  value={formik.values.trancheId}
                  options={
                    pools
                      ?.find((pool) => pool.id === formik.values.poolId)
                      ?.tranches.map((t) => {
                        return {
                          label: t.currency.displayName,
                          value: t.id,
                        }
                      }) ?? []
                  }
                  onChange={(event) => formik.setFieldValue('trancheId', event.target.value)}
                />
                <AddressNetworkInput formik={formik} poolId={formik.values.poolId} />
              </Stack>
              <Button type="submit" loading={isTransactionPending}>
                Add new investor
              </Button>
            </Stack>
          </Form>
        </FormikProvider>
      </Stack>
    </Drawer>
  )
}

function AddressNetworkInput({ formik, poolId }: { formik: FormikContextType<any>; poolId: string }) {
  const {
    evm: { chains },
  } = useWallet()
  const { data: domains } = useActiveDomains(poolId)
  const deployedLpChains = domains?.map((d) => d.chainId) ?? []
  return (
    <Stack gap={2} backgroundColor="backgroundSecondary" borderRadius="10px" padding={2}>
      <AddressInput
        value={formik.values.investorAddress}
        id="investorAddress"
        name="investorAddress"
        label="Wallet address"
        placeholder="Type here..."
        onChange={(event) => formik.setFieldValue('investorAddress', event.target.value)}
      />
      <Select
        label="Network*"
        id="network"
        name="network"
        options={[
          { value: '', label: 'Centrifuge' },
          ...deployedLpChains.map((chainId) => ({
            value: String(chainId),
            label: getChainInfo(chains, chainId).name,
          })),
        ]}
        onChange={(event) => formik.setFieldValue('network', event.target.value)}
      />
    </Stack>
  )
}
