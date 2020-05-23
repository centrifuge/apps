import * as React from 'react';
import BN from 'bn.js';
import { connect } from 'react-redux';
import { baseToDisplay, feeToInterestRate } from 'tinlake';
import { Box, Heading, Table, TableCell, TableRow, TableBody, Text, Button, Anchor } from 'grommet';
import SecondaryHeader from '../../components/SecondaryHeader';
import { PoolState, loadPool } from '../../ducks/pool';
import { LoansState, loadLoans } from '../../ducks/loans';
import { AuthState } from '../../ducks/auth';
import { Spinner } from '@centrifuge/axis-spinner';
import LoanListData from '../../components/Loan/List';
import Tinlake from 'tinlake/dist/Tinlake';
import { Pool } from '../../config';
import { PoolLink } from '../../components/PoolLink';
import { toPrecision } from '../../utils/toPrecision';

interface Props {
  tinlake: any;
  loans?: LoansState;
  loadLoans?: (tinlake: Tinlake) => Promise<void>;
  pool?: PoolState;
  auth?: AuthState;
  loadPool?: (tinlake: Tinlake) => Promise<void>;
  selectedPool: Pool;
}

class Overview extends React.Component<Props> {

  componentDidMount() {
    const { loadLoans, loadPool, tinlake } = this.props;
    loadLoans && loadLoans(tinlake);
    loadPool && loadPool(tinlake);

  }

  render() {
    const { tinlake, loans, auth, selectedPool, pool } = this.props;
    const userAddress = auth?.address || tinlake.ethConfig.from;

    const { name, description } = selectedPool;
    const allLoans = loans && loans.loans || [];
    const poolData = pool && pool.data;

    const outstandingLoans = allLoans.filter(loan => loan.status && loan.status === 'ongoing').length;
    const outstandingDebt = allLoans.map(loan => loan.debt).reduce((sum, debt) => sum.add(debt), new BN('0'));
    const availableFunds = poolData?.availableFunds || '0';
    const minJuniorRatio = poolData?.minJuniorRatio || '0';
    const currentJuniorRatio = poolData?.currentJuniorRatio || '0';
    const dropRate = poolData && poolData.senior && poolData.senior.interestRate || '0';
    const seniorTokenSupply = poolData && poolData.senior && poolData.senior.totalSupply || '0';
    const juniorTokenSupply = poolData && poolData.junior.totalSupply || '0';

    // show just recent 10 loans
    const startIndex = (allLoans.length >= 10) ? (allLoans.length - 10) : 0;
    const latestLoans = allLoans.slice(startIndex, allLoans.length);

    return <Box margin={{ bottom: 'large' }}>
      <SecondaryHeader>
        <Heading level="3">Pool Overview: {name} </Heading>
      </SecondaryHeader>

      <Box direction="row" margin={{ bottom: 'large' }}>
        <Box basis={'1/2'}>
          <Box>
            <Heading level="4" margin={{ top: 'small', bottom: 'small' }}>Loans</Heading>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">
                    Ongoing Loans
                    </TableCell>
                  <TableCell style={{ textAlign: 'end' }}> {outstandingLoans} </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    Outstanding Debt
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>DAI {toPrecision(baseToDisplay(outstandingDebt, 18), 2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    DAI available to borrow
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>DAI {toPrecision(baseToDisplay(availableFunds, 18), 2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Heading level="4" margin={{ top: 'large', bottom: 'small' }}>Investments</Heading>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">
                    Current TIN ratio
                    </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{toPrecision(baseToDisplay(currentJuniorRatio, 25), 2)} %</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    Minimum TIN ratio
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{toPrecision(baseToDisplay(minJuniorRatio, 25), 2)} %</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    DROP APR
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{toPrecision(feeToInterestRate(dropRate), 2)} %</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    DROP Supply
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{toPrecision(baseToDisplay(seniorTokenSupply, 18), 2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    TIN Supply
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{toPrecision(baseToDisplay(juniorTokenSupply, 18), 2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
        <Box basis={'1/2'} margin={{ left: 'large' }}>
          <Box>
            <Heading level="4" margin={{ top: 'small', bottom: 'small' }}>Asset Originator Details</Heading>

            <Text margin={{ top: 'xsmall' }}> {name} </Text>
            <Text margin={{ top: 'medium' }}> The following information is provided by the Asset Originator: </Text>
            <Text margin={{ top: 'small' }}> {description} </Text>
          </Box>
        </Box>
      </Box>

      <Heading level="4" margin={{ top: 'xsmall' }}>Latest loans</Heading>
      {(loans!.loansState === 'loading') ?
        <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} /> :
        <LoanListData loans={latestLoans} userAddress={userAddress}> </LoanListData>
      }
      <Box margin={{ top:'medium', bottom:'large' }} align="center">
        <PoolLink href={{ pathname: '/loans' }}>
          <Anchor>
            <Button  label="View all loans" />
          </Anchor>
        </PoolLink>
      </Box>
    </Box>;
  }
}

export default connect(state => state, { loadLoans, loadPool })(Overview);
