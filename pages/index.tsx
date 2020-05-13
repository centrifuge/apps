import { Box } from "grommet";
import Header from "../components/Header";
import Dashboard from "../containers/Dashboard";
import { menuItems } from "../menuItems";

function Home() {
  return (
    <Box align="center" pad={{ horizontal: "small" }}>
      <Header selectedRoute={"/"} menuItems={menuItems} />
      <Box justify="center" direction="row">
        <Box width="xlarge">
          <Dashboard />
        </Box>
      </Box>
    </Box>
  );
}

// export async function getStaticPaths() {
//   // We'll pre-render only these paths at build time.
//   const paths = [{
//     params: { root: '0x41b7b379dee711b1a9bfbabd4b1309a584f5fe5a' },
//     // TODO: use the following instead, depends on https://github.com/zeit/next.js/pull/7822, which is currently only in
//     // next.js canary
//     // params: { root: config.contractAddresses.ROOT_CONTRACT },
//   }]

//   // { fallback: false } means other routes should 404.
//   return { paths, fallback: false }
// }

// export async function getStaticProps() {
//   return {}
// }

export default Home;
