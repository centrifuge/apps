import { Box, Anchor } from 'grommet';
import Header, { MenuItem } from '../components/Header';
import Link from 'next/link';

const menuItems: MenuItem[] = [
  { label: 'Dashboard', route: '/' },
];

function Home() {
  return <Box align="center">
  <Header
    selectedRoute={''}
    menuItems={menuItems.reverse()}
    section="DASHBOARD"
  />
  <Box
    justify="center"
    direction="row"
  >
    <Box width="xlarge" >
      <Box pad="medium">
        <Link href="/temp/mint-nft"><Anchor>Borrower: Mint NFT</Anchor></Link>
        <Link href="/admin/whitelist-nft"><Anchor>Admin: Whitelist NFT</Anchor></Link>
        <Link href="/borrower"><Anchor>Borrower: Loan List</Anchor></Link>
        <Link href="/admin"><Anchor>Admin: Loan List</Anchor></Link>
      </Box>
    </Box>
  </Box>
</Box>;
}

export default Home;
