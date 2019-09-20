import { MenuItem } from './components/Header';
import config from './config'

const { isDemo } = config

const menuItems: MenuItem[] = [
  { label: 'Dashboard', route: '/' },
  { label: 'My Loans', route: '/borrower' },
  { label: 'Whitelist NFT', route: '/admin' },
];

isDemo &&  menuItems.push({ label: 'Mint NFT', route: '/demo/mint-nft'})

export {
  menuItems
}