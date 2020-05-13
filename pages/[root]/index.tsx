import { Box } from "grommet";
import Header from "../../components/Header";
import Overview from "../../containers/Overview";
import WithTinlake from "../../components/WithTinlake";
import { menuItems } from "../../menuItems";
import config from "../../config";
import { GetStaticProps } from "next";

interface Props {
  root: string
}

function Pool({ root }: Props) {
  return (
    <Box align="center" pad={{ horizontal: "small" }}>
      <Header selectedRoute={"/"} menuItems={menuItems} />
      <Box justify="center" direction="row">
        <Box width="xlarge">
          <WithTinlake render={(tinlake) => <Overview tinlake={tinlake} />} />
        </Box>
      </Box>
    </Box>
  );
}

export async function getStaticPaths() {
  // We'll pre-render only these paths at build time.
  const paths = [{
    params: { root: config.contractAddresses.ROOT_CONTRACT },
  }]

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return { props: { root: params?.root } }
}

export default Pool;
