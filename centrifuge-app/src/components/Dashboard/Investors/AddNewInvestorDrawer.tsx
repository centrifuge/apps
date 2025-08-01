import { getChainInfo, useCentrifugeApi, useCentrifugeTransaction, useWallet } from '@centrifuge/centrifuge-react'
import { AddressInput, Box, Button, Drawer, Select, Stack, Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import { Form, FormikContextType, FormikErrors, FormikProvider, useFormik } from 'formik'
import { useState } from 'react'
import { firstValueFrom } from 'rxjs'
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
  const api = useCentrifugeApi()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const [poolId, setPoolId] = useState(pools?.[0]?.id ?? '')

  const [account] = useSuitableAccounts({ poolId, poolRole: ['InvestorAdmin'] })

  const { execute, isLoading: isTransactionPending } = useCentrifugeTransaction(
    'Add new investor',
    (cent) =>
      (
        [poolId, trancheId, _chainId, centAddress, _evmAddress, validDuration]: [
          string,
          string,
          number | undefined,
          string,
          string,
          number
        ],
        options
      ) =>
        cent.pools.updatePoolRoles(
          [poolId, [[centAddress, { TrancheInvestor: [trancheId, validDuration] }]], []],
          options
        ),
    {
      onSuccess: async (args, result) => {
        const [poolId, trancheId, chainId, , evmAddress] = args

        if (!chainId) return

        const event = result.events.find(({ event }) => api.events.permissions.Added.is(event))
        console.log('event', event)
        if (event) {
          const eventData = event.toHuman() as any
          const validDuration = Number(eventData.event.data.role?.PoolRole?.TrancheInvestor?.[1]?.replace(/\D/g, ''))

          console.log('validDuration', validDuration)
          if (!validDuration) return

          const hash = ((result.data as any).toHuman() as any).status.InBlock
          const apiAt = await api.at(hash)
          const timestampAtBlock = await firstValueFrom(apiAt.query.timestamp.now())
          const timestamp = Number(timestampAtBlock.toPrimitive()) / 1000
          console.log('timestamp', timestamp)
          console.log('validUntil', timestamp + validDuration)

          executeUpdateMember([poolId, trancheId, chainId, evmAddress, timestamp + validDuration])
        }
      },
    }
  )

  const { isLoading: isUpdateMemberPending, execute: executeUpdateMember } = useCentrifugeTransaction(
    'Update member on EVM chain',
    (cent) =>
      ([poolId, trancheId, chainId, evmAddress, validTill]: [string, string, number, string, number], options) => {
        const tx = api.tx.liquidityPools.updateMember(poolId, trancheId, { EVM: [chainId, evmAddress] }, validTill)
        return cent.wrapSignAndSend(api, tx, options)
      }
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
      const TenYears = 10 * 365 * 24 * 60 * 60

      execute([poolId, trancheId, values.network || undefined, centAddress, validAddress, TenYears], {
        account,
      })
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

  const alreadyAllowed = formik.values.trancheId in allowedTranches

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
                <AddressNetworkInput formik={formik} poolId={poolId} addressAlreadyExists={alreadyAllowed} />
              </Stack>
              <Button
                type="submit"
                loading={isTransactionPending || isUpdateMemberPending}
                disabled={
                  !!formik.errors.investorAddress || !formik.values.investorAddress || alreadyAllowed || !validAddress
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
          Address already allowed
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
