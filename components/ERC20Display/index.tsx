import { FunctionComponent } from 'react';
import { Decimal } from 'decimal.js-light';
import { Box, Text } from 'grommet';
import styled from 'styled-components';
import { baseToDisplay } from 'tinlake';
import { addThousandsSeparators } from '../../utils/addThousandsSeparators';
import { copyToClipboard } from '@centrifuge/axis-utils';

export interface TokenMeta {
  symbol: string;
  logo: string;
  address: string;
  decimals: number;
}

export interface TokenMetas {
  [addr: string]: TokenMeta;
}

interface Props {
  value: string;
  precision?: number;
  tokenMetas: TokenMetas;
}

const ERC20Display: FunctionComponent<Props> = ({ value, precision, tokenMetas }: Props) => {
  Decimal.set({
    precision
  });

  const { decimals, logo, symbol } = firstOrThrow(tokenMetas);

  const valueToDecimal = new Decimal(baseToDisplay(value, decimals)).toFixed(precision);
  const formatted = addThousandsSeparators(valueToDecimal.toString());
  return <Box direction="row">
    <Amount onClick={(event) => {
      if (event.detail === 1) {
        // setCopied("Copied")
        copyToClipboard(formatted);
      }
    }}
    >

      <Text style={{
        fontSize: '0.7em', overflow: 'hidden', whiteSpace: 'nowrap',
        display: 'inline-block', maxWidth: '100%', textOverflow: 'ellipsis', verticalAlign: 'middle'
      }}>
        {formatted}
      </Text>
    </Amount>

    <LogoAndSymbol>
      <Logo src={logo} />
      <Text style={{ fontSize: '0.7em' }} >
        {symbol}
      </Text>
    </LogoAndSymbol>
  </Box>;
};

ERC20Display.defaultProps = {
  precision: 2
};

export default ERC20Display;

const Amount = styled.div`
  flex: 4 1 auto;
  overflow: hidden;
  min-width: 0px;
  :hover {cursor: copy}
`;

const LogoAndSymbol = styled.div`
  flex: 1 1 auto;
  margin: 0 0 0 16px;
`;

const Logo = styled.img`
  position: relative;
  top: -1px;
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 16px;
  height: 16px;
`;

function firstOrThrow(tokenMetas: TokenMetas): TokenMeta {
  const keys = Object.keys(tokenMetas);
  if (keys.length === 0) {
    throw new Error('tokenMeta property must have > 1 entry, found 0');
  }
  return tokenMetas[keys[0]];
}
