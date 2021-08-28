import { MenuItem } from './components/Header'

export const menuItems: MenuItem[] = [
  { label: 'Overview', route: '/', inPool: true, env: '' },
  { label: 'Investments', route: '/investments', inPool: true, env: '' },
  { label: 'Assets', route: '/assets', inPool: true, env: '' },
  { label: 'Management', route: '/management', inPool: true, env: 'admin' },
  { label: 'Mint NFT', route: '/demo/mint-nft', inPool: true, env: 'demo' },
  { label: 'Value NFT', route: '/demo/value-nft', inPool: true, env: 'demo' },
]

export const noDemo = (m: MenuItem) => m.env !== 'demo'
