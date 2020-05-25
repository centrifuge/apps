import { FunctionComponent } from 'react';
import { Decimal } from 'decimal.js-light';
import { Box, Text } from 'grommet';
import styled from 'styled-components';

export interface TokenMeta {
  symbol: string;
  logo: string;
  address: string;
  decimals: Number;
}

interface Props {
  value: string;
  precision?: number;
  tokenMeta: TokenMeta;
}

const ERC20Display: FunctionComponent<Props> = ({ value, precision, tokenMeta }: Props) => {
  Decimal.set({
    precision
  });

  const valueToDecimal  = new Decimal(value.toString()).toFixed(precision);
  const formatted = valueToDecimal.toString();
  return <Box direction="row">
      <Amount>
        <Text style={{ fontSize: '0.8em' }}>
          {formatted}
        </Text>
      </Amount>
      <LogoAndSymbol>
        <Logo src={tokenMeta.logo} />
        <Text style={{ fontSize: '0.8em' }} >
          {tokenMeta.symbol}
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
`;

const LogoAndSymbol = styled.div`
  flex: 1 1 auto;
  margin: 0 0 0 16px;
`;

const Logo = styled.img`
  position: relative;
  top: 1px;
  margin: 0 8px 0 0;
  width: 16px;
  height: 16px;
`;
