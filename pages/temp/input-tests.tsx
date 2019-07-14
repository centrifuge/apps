import * as React from 'react';
import { Box } from 'grommet';
import Alert from '../../components/Alert';
import NumberDisplay from '../../components/NumberDisplay';
import { NumberInput } from '@centrifuge/axis-number-input';
import { displayToBase } from '../../utils/displayToBase';
import { baseToDisplay } from '../../utils/baseToDisplay';

interface State {
  value: string;
}

class MintNFT extends React.Component<{}, State> {
  state: State = {
    value: '1234567',
  };

  render() {
    const { value } = this.state;

    return <Box>
      <Box pad={{ horizontal: 'medium' }}>
        <Alert type="info" margin={{ top: 'large' }}>
          This is a temporary testing page for inputs.
        </Alert>

        <Box direction="row" gap="medium" margin={{ vertical: 'large' }}>
          Uncontrolled NumberInput with precision 0: <NumberInput precision={0} />
          Uncontrolled NumberInput with precision 3: <NumberInput precision={3} />
          Uncontrolled NumberInput with precision 6: <NumberInput precision={6} />
        </Box>
        <Box direction="row" gap="medium" margin={{ vertical: 'large' }}>
          NumberInput with precision 0: <NumberInput value={baseToDisplay(value, 3)} precision={0}
            onChange={(maskedValue: string, floatValue: number) => {
              console.log({ maskedValue, floatValue });
              if (floatValue === undefined) { return; }
              this.setState({ value: displayToBase(`${floatValue}`, 3) });
            }} />
          NumberInput with precision 3: <NumberInput value={baseToDisplay(value, 3)} precision={3}
            onChange={(maskedValue: string, floatValue: number) => {
              console.log({ maskedValue, floatValue });
              if (floatValue === undefined) { return; }
              this.setState({ value: displayToBase(`${floatValue}`, 3) });
            }} />
          NumberInput with precision 6: <NumberInput value={baseToDisplay(value, 3)} precision={6}
            onChange={(maskedValue: string, floatValue: number) => {
              console.log({ maskedValue, floatValue });
              if (floatValue === undefined) { return; }
              this.setState({ value: displayToBase(`${floatValue}`, 3) });
            }} />
        </Box>
        <Box direction="row" gap="medium" margin={{ vertical: 'large' }}>
          NumberDisplay with precision 0: <NumberDisplay value={baseToDisplay(value, 3)}
            precision={0} />
          NumberDisplay with precision 3: <NumberDisplay value={baseToDisplay(value, 3)}
            precision={3} />
          NumberDisplay with precision 6: <NumberDisplay value={baseToDisplay(value, 3)}
            precision={6} />
        </Box>
      </Box>
    </Box>;
  }
}

export default MintNFT;
