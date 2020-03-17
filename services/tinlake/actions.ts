import BN from 'bn.js';
import { bnToHex, interestRateToFee } from 'tinlake';
import config from '../../config';

const { contractAddresses } = config;
const SUCCESS_STATUS = '0x1';
const nftRegistryAddress = contractAddresses['COLLATERAL_NFT'];

export interface NFT {
  tokenId: BN;
  nftOwner: string;
  nftData: any;
}

export interface Loan {
  loanId: BN;
  registry: string;
  tokenId: BN;
  ownerOf: BN;
  principal: BN;
  interestRate: BN;
  debt: BN;
  threshold?: BN;
  price?: BN;
  status?: string;
  nft?: NFT
}

export interface Investor {
  maxSupplyJunior: BN;
  maxSupplySenior?: BN;
  maxRedeemJunior: BN;
  maxRedeemSenior?: BN;
  tokenBalanceJunior: BN;
  tokenBalanceSenior?: BN;
  address: string;
}

export interface TinlakeResult {
  data?: any,
  errorMsg?: string,
  tokenId?: string,
  loanId?: string
}

export async function getNFT(tinlake: any, tokenId: string) {
  let nftOwner: string;
  let nftData: any;

  try {
    nftOwner = await tinlake.getOwnerOfCollateral(tokenId);
  } catch (e) {
    return loggedError(e, 'Could not get NFT owner for NFT ID', tokenId);
  }

  if (!nftOwner) {
    return loggedError({}, 'Could not get NFT owner for NFT ID', tokenId);
  }

  try {
    nftData = await tinlake.getNFTData(tokenId);
  } catch (e) {
    // return loggedError(e, 'Could not get NFT data for NFT ID', tokenId);
    nftData = null;
  }
  const replacedTokenId = tokenId.replace(/^0x/, '');
  const bnTokenId = new BN(replacedTokenId);

  const nft: NFT = {
    nftOwner,
    nftData,
    tokenId: bnTokenId
  };

  return {
    nft,
    tokenId
  };
}

export async function issue(tinlake: any, tokenId: string) {

  
  let result;
  try {
    result = await tinlake.issue(nftRegistryAddress, tokenId);
  } catch (e) {
    return loggedError(e, 'Could Issue loan.', tokenId)
  }

  if (result.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could Issue loan.', tokenId)
  }

  // TODO: use NFT lookup
  const loanCount: BN = await tinlake.loanCount();
  const loanId = (loanCount.toNumber() - 1).toString()
  return {
    data: loanId
  }
}

export async function getLoan(tinlake: any, loanId: string): Promise<TinlakeResult> {
  let loan;
  const count = await tinlake.loanCount();

  if (count.toNumber() <= Number(loanId) || Number(loanId) == 0) {
    return loggedError({}, 'Loan not found', loanId);
  }

  try {
    loan = await tinlake.getLoan(loanId);
  } catch (e) {
    return loggedError(e, 'Loan not found', loanId);
  }
  const nftData = await getNFT(tinlake, `${loan.tokenId}`);
  loan.nft = nftData && nftData.nft || {};

  return {
    data: loan
  }
}

export async function getLoans(tinlake: any): Promise<TinlakeResult> {
  let loans;

  try {
    loans = await tinlake.getLoanList();
  } catch (e) {
    return loggedError(e, 'Could not get loans', '');
  }

  const loansList = [];
  for (let i = 0; i < loans.length; i++) {
    loansList.push(loans[i]);
  }
  return {
    data: loansList
  }
}

export async function setCeiling(tinlake: any, loanId: string, ceiling: string): Promise<TinlakeResult> {
  let setRes;
  try {
    setRes = await tinlake.setCeiling(loanId, ceiling);
  } catch (e) {
    return loggedError(e, 'Could not set ceiling', loanId);
  }

  if (setRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not set ceiling', loanId);
  }
}

export async function setInterest(tinlake: any, loanId: string, debt: string, rate: string): Promise<TinlakeResult> {
  const rateGroup = interestRateToFee(rate);
  let existsRateGroup = await tinlake.existsRateGroup(rateGroup);

  // init rate group
  if (!existsRateGroup) {
    let initRes;
    try {
      initRes = await tinlake.initRate(rateGroup);
    } catch (e) {
      return loggedError(e, 'Could not init rate group', loanId);
    }

    if (initRes.status !== SUCCESS_STATUS) {
      return loggedError({}, 'Could not init rate group', loanId);
    }
  }
  // set rate group
  let setRes;
  try {
    if (debt.toString() === "0") {
      setRes = await tinlake.setRate(loanId, rateGroup);
    } else {
      setRes = await tinlake.changeRate(loanId, rateGroup);
    }
  } catch (e) {
    return loggedError(e, 'Could not set rate group', loanId);
  }

  if (setRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not set rate group', loanId);
  }
}

export async function getAnalytics(tinlake: any) {
  try {
    const availableFunds = await tinlake.getTrancheBalance();
    const tokenPriceJunior = await tinlake.getTokenPriceJunior();
    return {
      data: {
        availableFunds,
        tokenPriceJunior
      }
    }
  } catch(e) {
    return loggedError(e, 'Could not get analytics data', '');
  } 


} 

export async function borrow(tinlake: any, loan: Loan, amount: string) {
  const { loanId } = loan;
  const address = tinlake.ethConfig.from;

  // make sure tranche has enough funds
  const trancheReserve = await tinlake.getTrancheBalance();
  if(new BN(amount).cmp(trancheReserve) > 0) {
    return loggedError({},'There is not enough available funds.', loanId);
  }

  // approve nft
  let approveRes;
  try {
    approveRes = await tinlake.approveNFT(bnToHex(loan.tokenId), contractAddresses['SHELF']);
  } catch(e){
    return loggedError(e, 'Could not approve tinlake to lock NFT.', loanId);
  }
  if (approveRes.status !== SUCCESS_STATUS || approveRes.events[0].event.name !== 'Approval') {
    return loggedError({}, 'Could not approve tinlake to lock NFT', loanId);
  }

  // lock nft
  let lockRes;
  try {
    lockRes = await tinlake.lock(loanId);
  } catch(e){
    return loggedError(e, 'Could not lock NFT.', loanId);
  }
  if (lockRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not lock NFT', loanId);
  }

  // borrow
  let borrowRes;
  try {
    borrowRes = await tinlake.borrow(loanId, amount);
  } catch(e){
    return loggedError(e, 'Could not borrow.', loanId);
  }
  if (borrowRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not borrow', loanId);
  }
  
  //withdraw
  let withdrawRes;
  try {
    withdrawRes = await tinlake.withdraw(loanId, amount, address);
  } catch(e){
    return loggedError(e, 'Could not withdraw.', loanId);
  }
  if (withdrawRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not withdraw', loanId);
  }
}

// repay full loan debt
export async function repay(tinlake: any, loan: Loan) {
  const { loanId } = loan;


  // user entrie user balance as repay amount to make sure that enough funds are provided to cover the entire debt
  const repayAmount = await tinlake.getCurrencyBalance(tinlake.ethConfig.from);
  let approveRes;
  try {
    approveRes = await tinlake.approveCurrency(contractAddresses['SHELF'], repayAmount);
  } catch(e){
    return loggedError(e, 'Could not approve.', loanId);
  }
  if (approveRes.status !== SUCCESS_STATUS) {
    return loggedError({"response": approveRes}, 'Could not approve', loanId);
  }
   
  // repay
  let repayRes;
  try {
    repayRes = await tinlake.repay(loanId, repayAmount);
  } catch(e){
    return loggedError(e, 'Could not repay.', loanId);
  }
  if (repayRes.status !== SUCCESS_STATUS) {
    return loggedError({"response" : repayRes}, 'Could not repay', loanId);
  }

  // unlock 
  let unlockRes;
  try {
    unlockRes = await tinlake.unlock(loanId);
  } catch(e){
    return loggedError(e, 'Could not unlock.', loanId);
  }
  if (unlockRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not unlock', loanId);
  }

  // close 
  let closeRes;
  try {
    closeRes = await tinlake.close(loanId);
  } catch(e){
    return loggedError(e, 'Could not unlock.', loanId);
  }
  if (closeRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not unlock', loanId);
  }
}

export async function getInvestor(tinlake: any, address: string) {
  let investor;
  try {
    investor = await tinlake.getInvestor(address);
  } catch (e) {
    return loggedError(e, 'Investor not found', address);
  }
  return {
    data: investor
  }
}

export async function setAllowanceJunior(tinlake: any, address: string, maxSupplyAmount: string, maxRedeemAmount: string) {
 let setRes;
  try {
    setRes = await tinlake.approveAllowanceJunior(address, maxSupplyAmount, maxRedeemAmount);
  } catch (e) {
    return loggedError(e, 'Could not set allowance.', address);
  }
  if (setRes.status !== SUCCESS_STATUS) {
    return loggedError(null, 'Could not set allowance.', address);
  }
}

export async function supplyJunior(tinlake: any, supplyAmount: string) {

  // approve currency
  let approveRes;
  try {
    approveRes = await tinlake.approveCurrency(contractAddresses['JUNIOR'], supplyAmount);
  } catch(e) {
    return loggedError(e, 'Could not approve currency.', '');
  }
  if (approveRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not approve currency.', '');
  }
   
  // repay
  let supplyRes;
  try {
    supplyRes = await tinlake.supplyJunior(supplyAmount);
  } catch(e){
    return loggedError(e, 'Could not supply junior.', '');
  }
  if (supplyRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not supply junior.', '');
  }
}

export async function redeemJunior(tinlake: any, redeemAmount: string) {
  // approve junior token 
  let approveRes;
  try {
    approveRes = await tinlake.approveJuniorToken(contractAddresses['JUNIOR'], redeemAmount);
  } catch(e){
    return loggedError(e, 'Could not approve juniorToken.', '');
  }
  if (approveRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not approve juniorToken.', '');
  }
   
  // repay
  let redeemRes;
  try {
    redeemRes = await tinlake.redeemJunior(redeemAmount);
  } catch(e){
    return loggedError(e, 'Could not redeem junior.', '');
  }
  if (redeemRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not redeem junior.', '');
  }
}


function loggedError(error: any, message: string, id: string) {
  console.log(`${message} ${id}`, error);
  return {
    errorMsg: `${error} - ${message} ${id}`,
    id
  };
}
