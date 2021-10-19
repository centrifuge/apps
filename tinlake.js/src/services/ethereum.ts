const abiCoder = require('web3-eth-abi')
import { sha3 } from 'web3-utils'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export interface Events {
  txHash: string
  status: any
  events: { event: { name: any }; data: any[] }[]
}

export const findEvent = (abi: { filter: (arg0: (item: any) => boolean | undefined) => any[] }, funcSignature: any) => {
  return abi.filter(
    (item: {
      type: string
      name: string
      inputs: { map: (arg0: (input: any) => any) => { join: (arg0: string) => string } }
    }) => {
      if (item.type !== 'event') return false
      const signature = `${item.name}(${item.inputs.map((input: { type: any }) => input.type).join(',')})`
      const hash = sha3(signature)
      if (hash === funcSignature) return true
    }
  )
}

// eslint-disable-next-line no-unused-vars
const getEvents = (
  receipt: {
    logs: { length: number; forEach: (arg0: (log: any) => void) => void }
  },
  abi: any
) => {
  if (!receipt.logs || receipt.logs.length === 0) {
    return null
  }
  const events: { event: any; data: any }[] = []
  receipt.logs.forEach((log: { topics: any[] }) => {
    const funcSignature = log.topics[0]
    const matches = findEvent(abi, funcSignature)
    if (matches.length === 1) {
      const event = matches[0]
      const inputs = event.inputs
        .filter((input: { indexed: any }) => input.indexed)
        .map((input: { type: any }) => input.type)

      // remove 0x prefix from topics
      const topics = log.topics.map((t: { replace: (arg0: string, arg1: string) => void }) => t.replace('0x', ''))

      // concat topics without first topic (func signature)
      const bytes = `0x${topics.slice(1).join('')}`
      const data = abiCoder.decodeParameters(inputs, bytes)

      events.push({ event, data })
    }
  })
  return events
}
