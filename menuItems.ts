import { MenuItem } from './components/Header';

export const menuItems: MenuItem[] = [
  { label: 'Dashboard', route: '/' , env: ''},
  { label: 'Loans', route: '/loans', env: ''},
  { label: 'Investments', route: '/investments', env: ''},
  { label: 'Mint NFT', route: '/demo/mint-nft', env: 'demo'}
];
