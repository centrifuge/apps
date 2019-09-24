import { MenuItem } from './components/Header';

export const menuItems: MenuItem[] = [
  { label: 'Dashboard', route: '/' },
  { label: 'My Loans', route: '/borrower' },
  { label: 'Whitelist NFT', route: '/admin', permission: 'admin' },
  { label: 'Mint NFT', route: '/demo/mint-nft', permission: 'demo' }
];
