import { Contract, Signature } from 'ethers'

export async function signERC2612Permit(
  provider: any,
  token: string | { name: string; version: string; chainId: number; verifyingContract: string },
  owner: string,
  spender: string,
  value: string,
  deadline: number
) {
  const tokenAddress = typeof token === 'string' ? token : token.verifyingContract
  const tokenContract = new Contract(
    tokenAddress,
    ['function name() view returns (string)', 'function nonces(address) view returns (uint256)'],
    provider
  )

  let name: string, version: string, chainId: number
  if (typeof token === 'string') {
    name = await tokenContract.name()
    version = '1'
    chainId = Number((await provider.getNetwork()).chainId)
  } else {
    ;({ name, version, chainId } = token)
  }

  const domain = {
    name,
    version,
    chainId,
    verifyingContract: tokenAddress,
  }

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  }

  const nonce = await tokenContract.nonces(owner)

  const values = {
    owner,
    spender,
    value,
    nonce,
    deadline,
  }

  const signature = await provider.signTypedData(domain, types, values)
  const { v, r, s } = Signature.from(signature)

  return {
    owner,
    spender,
    value,
    deadline,
    v,
    r,
    s,
  }
}
