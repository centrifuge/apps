import { Constructor, TinlakeParams } from '../Tinlake';
import { executeAndRetry, ZERO_ADDRESS } from '../services/ethereum';
import { Loan, Investor } from '../types/tinlake';
import BN from 'bn.js';

export function AnalyticsActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IAnalyticsActions {

    // borrower analytics
    getTotalDebt = async (): Promise<BN> => {
      const res: { 0: BN } = await executeAndRetry(this.contracts['PILE'].total, []);
      return res[0];
    }

    getTotalBalance = async (): Promise<BN> => {
      const res: { 0: BN } = await executeAndRetry(this.contracts['SHELF'].balance, []);
      return res[0];
    }

    getPrincipal = async (loanId: string): Promise<BN> => {
      const res = await executeAndRetry(this.contracts['CEILING'].ceiling, [loanId]);
      return res ? res[0] : new BN(0);
    }

    getDebt = async (loanID: string): Promise<BN> => {
      const res = await executeAndRetry(this.contracts['PILE'].debt, [loanID]);
      return res ? res[0] : new BN(0);
    }

    loanCount = async (): Promise<BN> => {
      const res: { 0: BN }  = await executeAndRetry(this.contracts['TITLE'].count, []);
      return res[0];
    }

    getCollateral = async (loanId: string): Promise<any> => {
      const res = await executeAndRetry(this.contracts['SHELF'].shelf, [loanId]);
      return res;
    }

    getOwnerOfCollateral = async (nftRegistryAddr:string, tokenId: string): Promise<BN> => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftRegistryAddr);
      const res : { 0: BN } = await executeAndRetry(nft.ownerOf, [tokenId]);
      return res[0];
    }

    getInterestRate = async (loanId: string): Promise<BN> => {
      // retrieve nftId = hash from tokenID & registry
      const nftId = (await executeAndRetry(this.contracts['NFT_FEED'].nftID, [loanId]))[0];
      // retrieve riskgroup fro nft
      const riskGroupRes : { 0: BN } = await executeAndRetry(this.contracts['NFT_FEED'].risk, [nftId]);
      const riskGroup = riskGroupRes[0] || new BN(0);
      const res = await executeAndRetry(this.contracts['PILE'].rates, [riskGroup]);
      return res ? res[2] : new BN(0);
    }

    getOwnerOfLoan = async (loanId: string): Promise<any> => {
      let address;
      try {
        const res = await executeAndRetry(this.contracts['TITLE'].ownerOf, [loanId]);
        address = res[0];
      } catch (e) {
        address = ZERO_ADDRESS;
      }
      return address;
    }

    getStatus = async(nftRegistryAddr: string, tokenId: string, loanId: string): Promise<any> => {
      if (await this.getOwnerOfCollateral(nftRegistryAddr, tokenId) === this.contracts['SHELF'].address) {
        return 'ongoing';
      }
      if (await this.getOwnerOfLoan(loanId) === ZERO_ADDRESS) {
        return 'closed';
      }
      return 'opened';
    }

    getLoan = async (loanId: string): Promise<Loan | null> => {
      if (loanId === '0') { return null; }
      const collateral = await this.getCollateral(loanId);
      const principal = await this.getPrincipal(loanId);
      const ownerOf = await this.getOwnerOfLoan(loanId);
      const interestRate = await this.getInterestRate(loanId);
      const debt = await this.getDebt(loanId);
      const status = await this.getStatus(collateral.registry, collateral.tokenId, loanId);

      return {
        loanId,
        principal,
        interestRate,
        ownerOf,
        debt,
        status,
        registry: collateral.registry,
        tokenId: collateral.tokenId,
      };
    }

    getLoanList = async (): Promise<Loan[]> => {
      const loanArray = [];
      const count = (await this.loanCount()).toNumber();
      for (let i = 0; i < count; i += 1) {
        const loan = await this.getLoan(i.toString());
        loan && loanArray.push(loan);
      }
      return loanArray;
    }

    // lender analytics
    getInvestor = async (user: string) : Promise<Investor> => {
      const includeSenior = this.existsSenior();
      const tokenBalanceJunior = await this.getJuniorTokenBalance(user);
      const tokenBalanceSenior = includeSenior && await this.getSeniorTokenBalance(user) || new BN(0);
      const maxSupplyJunior = await this.getMaxSupplyAmountJunior(user);

      const maxSupplySenior = includeSenior && await this.getMaxSupplyAmountSenior(user) || new BN(0);
      const maxRedeemJunior = await this.getMaxRedeemAmountJunior(user);
      const maxRedeemSenior = includeSenior && await this.getMaxRedeemAmountSenior(user) || new BN(0);

      return {
        junior: {
          tokenBalance: tokenBalanceJunior,
          maxSupply: maxSupplyJunior,
          maxRedeem: maxRedeemJunior,
        },
        senior: {
          tokenBalance: tokenBalanceSenior || new BN(0),
          maxSupply: maxSupplySenior || new BN(0),
          maxRedeem: maxRedeemSenior || new BN(0),
        },
        address: user,
      };
    }

    getJuniorTokenBalance = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].balanceOf, [user]);
      return res[0];
    }

    getJuniorTotalSupply = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].totalSupply, []);
      return res[0];
    }

    getMaxSupplyAmountJunior = async (user: string) => {
      const res : { 0: BN } =  await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].maxCurrency, [user]);
      return res[0];
    }

    getMaxRedeemAmountJunior = async (user: string) => {
      const res  =  await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].maxToken, [user]);
      return res[0];
    }

    getTokenPriceJunior = async () => {
      const res =  await executeAndRetry(this.contracts['ASSESSOR'].calcTokenPrice, [this.contractAddresses['JUNIOR']]);
      return res[0];
    }

    existsSenior = () => {
      return this.contractAddresses['SENIOR_OPERATOR'] !== ZERO_ADDRESS;
    }

    getSeniorTokenBalance = async (user: string) => {
      if (!this.existsSenior()) {
        return new BN(0);
      }
      const res : { 0: BN } = await executeAndRetry(this.contracts['SENIOR_TOKEN'].balanceOf, [user]);
      return res[0];
    }

    getSeniorTotalSupply = async (user: string) => {
      if (!this.existsSenior()) {
        return new BN(0);
      }
      const res : { 0: BN } = await executeAndRetry(this.contracts['SENIOR_TOKEN'].totalSupply, []);
      return res[0];
    }

    getMaxSupplyAmountSenior = async (user: string) => {
      if (this.contractAddresses['SENIOR_OPERATOR'] === ZERO_ADDRESS) return new BN(0);

      const operatorType = this.getOperatorType('senior');
      let maxSupply : BN;
      switch (operatorType) {
        case 'PROPORTIONAL_OPERATOR':
          const supplyLimitRes: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].supplyMaximum, [user]);
          const suppliedRes: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].tokenReceived, [user]);
          maxSupply = supplyLimitRes[0].sub(suppliedRes[0]);
          break;

        case 'ALLOWANCE_OPERATOR':
          const res: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].maxCurrency, [user]);
          maxSupply = res[0];
          break;
        default:
          maxSupply = new BN(0);
      }
      return maxSupply;
    }

    getMaxRedeemAmountSenior = async (user: string) => {
      if (this.contractAddresses['SENIOR_OPERATOR'] === ZERO_ADDRESS) return new BN(0);

      const operatorType = this.getOperatorType('senior');
      let maxRedeem : BN;
      switch (operatorType) {
        case 'PROPORTIONAL_OPERATOR':
          const redeemLimitRes: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].calcMaxRedeemToken, [user]);
          maxRedeem = redeemLimitRes[0];
          break;
        case 'ALLOWANCE_OPERATOR':
          const res : { 0: BN } =  await executeAndRetry(this.contracts['SENIOR_OPERATOR'].maxToken, [user]);
          maxRedeem = res[0];
          break;
        default:
          maxRedeem = new BN(0);
      }
      return maxRedeem;
    }

    getTokenPriceSenior = async (user?: string) => {
      if (this.contractAddresses['SENIOR_OPERATOR'] === ZERO_ADDRESS) return new BN(0);

      // if no user address is passed always use price from asessor
      const operatorType = user ? this.getOperatorType('senior') : 'ALLOWANCE_OPERATOR';
      let tokenPrice : BN;
      switch (operatorType) {
        case 'PROPORTIONAL_OPERATOR':
          const customTokenPriceRes: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].calcTokenPrice, [user]);
          tokenPrice = customTokenPriceRes[0];
          break;
        case 'ALLOWANCE_OPERATOR':
          const res: { 0: BN } = await executeAndRetry(this.contracts['ASSESSOR'].calcTokenPrice, [this.contractAddresses['SENIOR']]);
          tokenPrice = res[0];
          break;
        default:
          tokenPrice = new BN(0);
      }
      return tokenPrice;
    }

    getSeniorReserve = async () => {
      if (this.contractAddresses['SENIOR'] !== ZERO_ADDRESS) {
        const res: { 0: BN } =  await executeAndRetry(this.contracts['SENIOR'].balance, []);
        return res[0] || new BN(0);
      }
      return new BN(0);
    }

    getJuniorReserve = async () => {
      const res: { 0: BN } =  await executeAndRetry(this.contracts['JUNIOR'].balance, []);
      return res[0] || new BN(0);
    }

    getMinJuniorRatio = async () => {
      const res: { 0: BN } =  await executeAndRetry(this.contracts['ASSESSOR'].minJuniorRatio, []);
      return res[0] || new BN(0);
    }

    getCurrentJuniorRatio = async () => {
      const res: { 0: BN } =  await executeAndRetry(this.contracts['ASSESSOR'].currentJuniorRatio, []);
      return res[0] || new BN(0);
    }

    getAssetValueJunior = async () => {
      const res: { 0: BN } =  await executeAndRetry(this.contracts['ASSESSOR'].calcAssetValue, [this.contractAddresses['JUNIOR']]);
      return res[0] || new BN(0);
    }

    getSeniorDebt = async () => {
      if (this.contractAddresses['SENIOR'] !== ZERO_ADDRESS) {
        const res: { 0: BN } =  await executeAndRetry(this.contracts['SENIOR'].debt, []);
        return res[0] || new BN(0);
      }
      return new BN(0);
    }

    getSeniorInterestRate = async () => {
      if (this.contractAddresses['SENIOR'] !== ZERO_ADDRESS) {
        const res: { 0: BN } =  await executeAndRetry(this.contracts['SENIOR'].ratePerSecond, []);
        return res[0] || new BN(0);
      }
      return new BN(0);
    }
  };
}

export type IAnalyticsActions = {
  getTotalDebt(): Promise<BN>,
  getTotalBalance(): Promise<BN>,
  getDebt(loanId:string): Promise<BN>,
  loanCount(): Promise<BN>,
  getLoanList(): Promise<Loan[]>,
  getLoan(loanId: string): Promise<Loan | null>,
  getCollateral(loanId:string):Promise<any>,
  getPrincipal(loanId:string):Promise<BN>,
  getInterestRate(loanId:string):Promise<BN>,
  getOwnerOfLoan(loanId:string):Promise<BN>,
  getOwnerOfCollateral(nftRegistryAddr:string, tokenId:string, loanId:string):Promise<BN>,
  existsSenior(): boolean,
  getJuniorReserve(): Promise<BN>,
  getSeniorReserve(): Promise<BN>,
  getJuniorTokenBalance(user: string): Promise<BN>,
  getSeniorTokenBalance(user: string): Promise<BN>,
  getMaxSupplyAmountJunior(user: string): Promise<BN>,
  getMaxRedeemAmountJunior(user: string): Promise<BN>,
  getMaxSupplyAmountSenior(user: string): Promise<BN>,
  getMaxRedeemAmountSenior(user: string): Promise<BN>,
  getTokenPriceJunior(): Promise<BN>,
  getTokenPriceSenior(user: string): Promise<BN>,
  getSeniorDebt(): Promise<BN>,
  getSeniorInterestRate(): Promise<BN>,
  getMinJuniorRatio(): Promise<BN>,
  getCurrentJuniorRatio(): Promise<BN>,
  getAssetValueJunior(): Promise<BN>,
  getInvestor(user:string): Promise<Investor>,
};

export default AnalyticsActions;
