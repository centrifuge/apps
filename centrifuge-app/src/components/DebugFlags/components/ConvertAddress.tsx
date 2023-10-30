import { addressToHex } from '@centrifuge/centrifuge-js'
import {
  getChainInfo,
  truncateAddress,
  useCentrifugeApi,
  useCentrifugeUtils,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { Dialog, Grid, Select, Stack, Text, TextInput } from '@centrifuge/fabric'
import { isAddress as isEvmAddress } from '@ethersproject/address'
import { isAddress as isSubstrateAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { copyToClipboard } from '../../../utils/copyToClipboard'

enum LocationType {
  Parachain = 'Parachain',
  Relaychain = 'Relaychain',
  Native = 'Native',
  EVM = 'EVM',
}

export function ConvertAddress() {
  const [open, setOpen] = React.useState(false)
  const {
    evm: { accounts: evmAccounts, chains },
    substrate: { accounts: substrateAccounts },
  } = useWallet()

  const [address, setAddress] = React.useState('')
  const [locationType, setLocationType] = React.useState<LocationType>(LocationType.Parachain)
  const [locationDetail, setLocationDetail] = React.useState('')
  const utils = useCentrifugeUtils()
  const api = useCentrifugeApi()
  const addressListId = React.useId()
  const locationListId = React.useId()
  const isValidAddress =
    locationType === LocationType.EVM
      ? isEvmAddress(address)
      : locationType === LocationType.Parachain
      ? isSubstrateAddress(address) || isEvmAddress(address)
      : !isEvmAddress(address) && isSubstrateAddress(address)

  function getMultilocation() {
    if (!isValidAddress) return null
    switch (locationType) {
      case LocationType.Parachain:
        if (!locationDetail) return null
        return {
          parents: 1,
          interior: {
            X2: [
              {
                Parachain: locationDetail,
              },
              isEvmAddress(address)
                ? {
                    AccountKey20: {
                      network: null,
                      key: address,
                    },
                  }
                : {
                    AccountId32: {
                      id: addressToHex(address),
                    },
                  },
            ],
          },
        }
      case LocationType.Relaychain:
        return {
          parents: 1,
          interior: {
            X1: {
              AccountId32: {
                id: addressToHex(address),
              },
            },
          },
        }
      case LocationType.Native:
        return {}
      case LocationType.EVM:
        if (!locationDetail) return null
        return {
          parents: 0,
          interior: {
            X1: {
              AccountKey20: {
                network: { Ethereum: { chainId: locationDetail } },
                key: address,
              },
            },
          },
        }
    }
  }

  const multilocation = getMultilocation()

  const { data: convertedAddress } = useQuery(
    [address, locationType, locationDetail],
    async () => {
      if (locationType === LocationType.Native) return address
      const addr = await firstValueFrom(api.call.accountConversionApi.conversionOf(multilocation))
      return addr.toHuman() as string
    },
    {
      enabled: !!address && !!multilocation && isValidAddress,
      staleTime: Infinity,
    }
  )

  return (
    <>
      <button onClick={() => setOpen(true)}>Convert address</button>
      <Dialog title="Convert address" width="800px" isOpen={open} onClose={() => setOpen(false)}>
        <Stack gap={4}>
          <Stack gap={1}>
            <datalist id={addressListId}>
              {evmAccounts?.map((addr) => (
                <option value={addr}>{truncateAddress(addr)} (EVM)</option>
              ))}
              {substrateAccounts?.map((acc) => (
                <option value={utils.formatAddress(acc.address)}>
                  {acc.name && `${acc.name} - `}
                  {truncateAddress(utils.formatAddress(acc.address))}
                </option>
              ))}
            </datalist>
            <Select
              label="From"
              value={locationType}
              options={[
                { label: 'Parachain', value: LocationType.Parachain },
                { label: 'Relaychain', value: LocationType.Relaychain },
                { label: 'Native', value: LocationType.Native },
                { label: 'EVM', value: LocationType.EVM },
              ]}
              onChange={(e) => {
                setLocationType(e.target.value as any)
              }}
            />
            {locationType === LocationType.EVM ? (
              <>
                <TextInput
                  label="EVM chain ID"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  list={locationListId}
                />
                <datalist id={locationListId}>
                  {Object.keys(chains).map((chainId) => (
                    <option value={chainId}>
                      {chainId} - {getChainInfo(chains, Number(chainId)).name}
                    </option>
                  ))}
                </datalist>
              </>
            ) : locationType === LocationType.Parachain ? (
              <>
                <TextInput
                  label="Para ID"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  list={locationListId}
                />
                <datalist id={locationListId}></datalist>
              </>
            ) : null}

            <TextInput
              label={
                locationType === LocationType.EVM
                  ? 'EVM address'
                  : locationType === LocationType.Parachain
                  ? 'Substrate or EVM address'
                  : 'Substrate address'
              }
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              list={addressListId}
              errorMessage={address && !isValidAddress ? 'Invalid address' : ''}
            />
          </Stack>
          {convertedAddress && (
            <Stack gap={2}>
              <Text variant="heading3">Converted address</Text>
              <Grid columns={2} gap={1}>
                <Text variant="label1">ss58</Text>
                <Text
                  style={{ wordBreak: 'break-all', cursor: 'copy' }}
                  onClick={() => copyToClipboard(utils.formatAddress(convertedAddress))}
                >
                  {utils.formatAddress(convertedAddress)}
                </Text>

                <Text variant="label1">hex</Text>
                <Text
                  style={{ wordBreak: 'break-all', cursor: 'copy' }}
                  onClick={() => copyToClipboard(addressToHex(convertedAddress))}
                >
                  {addressToHex(convertedAddress)}
                </Text>
              </Grid>
            </Stack>
          )}
        </Stack>
      </Dialog>
    </>
  )
}
