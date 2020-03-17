import testConfig from '../../test/config';
import { ITinlake } from '../Tinlake';
import { createTinlake, TestProvider} from '../../test/utils';


const governanceTinlake = createTinlake(testConfig.godAccount, testConfig);
const testProvider = new TestProvider(testConfig);

const { contractAddresses} = testConfig

describe.only('setup', async () => {

  before(async () =>  {
    const adminAddress = '0x3334273e545826E4C42569cF35E80C529DfA7185';
    const borrowerAddress = '0x8c006EBBaD3255dd20021B7ecEBedbf47F043603';
    const lenderAddress = '0x2f00338f29cc3D2F66b869d3c36Aa8bE24E3462b';
    const ethAmount = '1000000000000000000000';
    const currencyAmount = '1000000000000000000000000000000000000';

    await setupTestAccounts(adminAddress, lenderAddress, borrowerAddress, ethAmount, currencyAmount);
    for (let i = 0; i<5; i++) {
       await governanceTinlake.mintTitleNFT(borrowerAddress);
     }
  });

  it.only(' setup accounts for UI testing', async () => {

  });

});

export async function setupTestAccounts(admin: string, lender: string, borrower: string, ethAmount: string, currencyAmount: string) {
  // admin setup
  await governanceTinlake.relyAddress(admin, contractAddresses["CEILING"]);
  await governanceTinlake.relyAddress(admin, contractAddresses["PILE"]);
  await governanceTinlake.relyAddress(admin, contractAddresses["JUNIOR_OPERATOR"]);
  await testProvider.fundAccountWithETH(admin, ethAmount);
  // borrower setup
  await testProvider.fundAccountWithETH(borrower, ethAmount);
  // lender setup
  await testProvider.fundAccountWithETH(lender, ethAmount);
  await governanceTinlake.mintCurrency(lender, currencyAmount);
}
