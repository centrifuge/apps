import { Box } from "grommet";
import Header from "../../components/Header";
import Overview from "../../containers/Overview";
import WithTinlake from "../../components/WithTinlake";
import { menuItems } from "../../menuItems";

function Pool() {
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

export default Pool;
