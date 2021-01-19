const abi = [
  { inputs: [], payable: false, stateMutability: 'nonpayable', type: 'constructor' },
  {
    anonymous: true,
    inputs: [
      { indexed: true, internalType: 'bytes4', name: 'sig', type: 'bytes4' },
      { indexed: true, internalType: 'address', name: 'guy', type: 'address' },
      { indexed: true, internalType: 'bytes32', name: 'foo', type: 'bytes32' },
      { indexed: true, internalType: 'bytes32', name: 'bar', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'wad', type: 'uint256' },
      { indexed: false, internalType: 'bytes', name: 'fax', type: 'bytes' },
    ],
    name: 'LogNote',
    type: 'event',
  },
  {
    constant: false,
    inputs: [{ internalType: 'address', name: 'usr', type: 'address' }],
    name: 'deny',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'usr', type: 'address' }],
    name: 'hasMember',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'usr', type: 'address' }],
    name: 'member',
    outputs: [],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'members',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'x', type: 'uint256' },
      { internalType: 'uint256', name: 'y', type: 'uint256' },
    ],
    name: 'rdiv',
    outputs: [{ internalType: 'uint256', name: 'z', type: 'uint256' }],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ internalType: 'address', name: 'usr', type: 'address' }],
    name: 'rely',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'x', type: 'uint256' },
      { internalType: 'uint256', name: 'y', type: 'uint256' },
    ],
    name: 'rmul',
    outputs: [{ internalType: 'uint256', name: 'z', type: 'uint256' }],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'x', type: 'uint256' },
      { internalType: 'uint256', name: 'y', type: 'uint256' },
    ],
    name: 'safeAdd',
    outputs: [{ internalType: 'uint256', name: 'z', type: 'uint256' }],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'x', type: 'uint256' },
      { internalType: 'uint256', name: 'y', type: 'uint256' },
    ],
    name: 'safeDiv',
    outputs: [{ internalType: 'uint256', name: 'z', type: 'uint256' }],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'x', type: 'uint256' },
      { internalType: 'uint256', name: 'y', type: 'uint256' },
    ],
    name: 'safeMul',
    outputs: [{ internalType: 'uint256', name: 'z', type: 'uint256' }],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'x', type: 'uint256' },
      { internalType: 'uint256', name: 'y', type: 'uint256' },
    ],
    name: 'safeSub',
    outputs: [{ internalType: 'uint256', name: 'z', type: 'uint256' }],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: 'usr', type: 'address' },
      { internalType: 'uint256', name: 'validUntil', type: 'uint256' },
    ],
    name: 'updateMember',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'wards',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export default abi
