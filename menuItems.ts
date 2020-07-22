import { MenuItem } from './components/Header'

export const menuItems: MenuItem[] = [
  { label: 'Overview', route: '/', inPool: true, env: '' },
  { label: 'Assets', route: '/assets', inPool: true, env: '' },
  { label: 'Investments', route: '/investments', inPool: true, env: '' },
  { label: 'Mint NFT', route: '/demo/mint-nft', inPool: true, env: 'demo' },
]
