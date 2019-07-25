import { Box, Anchor } from 'grommet';
import Header, { MenuItem } from '../components/Header';
import Link from 'next/link';
import Dashboard from '../components/Dashboard';
import WithTinlake from '../components/WithTinlake';

const menuItems: MenuItem[] = [
  { label: 'Dashboard', route: '/' },
];

function Home() {
  return <Box align="center">
  <Header
    selectedRoute={''}
    menuItems={menuItems.reverse()}
    section=""
  />
  <Box
    justify="center"
    direction="row"
  >
    <Box width="xlarge" >
      <WithTinlake render={tinlake => <Dashboard tinlake={tinlake} />} />

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
