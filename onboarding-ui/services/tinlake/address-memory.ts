/**
 * We use this to store values for a specific Ethereum address in local storage.
 * Specifically, we are currently using to track whether an address does not support permits,
 * and if so, we immediately skip trying to sign a permit, and move to the old approval process.
 */

type AddressMemoryItem = {
  supportsPermits?: boolean
}

const AddressMemoryKey = 'address-memory'

export const getAddressMemory = (address: string): AddressMemoryItem | undefined => {
  const json = window.localStorage.getItem(AddressMemoryKey)
  if (json) {
    const memory = JSON.parse(json)
    return address in memory ? memory[address] : undefined
  }

  return undefined
}

export const setAddressMemory = <K extends keyof AddressMemoryItem>(
  address: string,
  key: K,
  value: AddressMemoryItem[K]
) => {
  const json = window.localStorage.getItem(AddressMemoryKey)
  let newMemory
  if (json) {
    const memory = JSON.parse(json)
    if (address in memory) {
      newMemory = { ...memory, address: { ...memory[address], [key]: value } }
    } else {
      newMemory = { ...memory, [address]: { [key]: value } }
    }
  } else {
    newMemory = { [address]: { [key]: value } }
  }

  window.localStorage.setItem(AddressMemoryKey, JSON.stringify(newMemory))
}
