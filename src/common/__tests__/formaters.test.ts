import { formatCurrency, formatDate, formatPercent, getCurrencyFormat, getPercentFormat } from '../formaters';

describe('Formatters', () => {
  it('Should return the correct currency parts', () => {
    expect(getCurrencyFormat('USD')).toEqual(
      {
        thousandSeparator: ',',
        decimalSeparator: '.',
        precision: 2,
        prefix: '$',
      },
    );

    expect(getCurrencyFormat('EUR')).toEqual(
      {
        thousandSeparator: ',',
        decimalSeparator: '.',
        precision: 2,
        prefix: '€',
      },
    );
  });


  it('Should return the correct percent parts', () => {
    expect(getPercentFormat()).toEqual(
      {
        thousandSeparator: ',',
        decimalSeparator: '.',
        precision: 2,
        suffix: '%',
      },
    );
  });

  it('Should format currency the correct way', () => {
    expect(formatCurrency("1000",'USD')).toEqual('$1,000.00');
  });

  it('Should format percent the correct way', () => {
    expect(formatPercent("10")).toEqual('1,000.00%');
  });

  it('Should format Date the correct way', () => {
    expect(formatDate("2019-06-05T00:00:00.000Z")).toEqual('06/05/2019');
  });
});
