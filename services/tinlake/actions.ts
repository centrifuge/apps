import BN from 'bn.js';
import { Loan, Investor, Tranche, NFT, interestRateToFee } from 'tinlake';
import config from '../../config';

const { contractAddresses } = config;
const SUCCESS_STATUS = '0x1';
const nftRegistryAddress = contractAddresses['COLLATERAL_NFT'];
interface TinlakeResult {
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
  let proxyAddress; 
  const address = tinlake.ethConfig.from;
  try {
    proxyAddress = await tinlake.checkProxyExists(address);
    console.log("proxy found", proxyAddress);
  } catch(e) {
    proxyAddress = null;
  }

  if (!proxyAddress) {
    try {
      proxyAddress = await tinlake.proxyCreateNew(address);
      console.log("proxy not found found, new proxy address", proxyAddress);
    } catch(e) {
      return loggedError(e, 'Could not create Proxy.', address);
    }
  }
  if (!proxyAddress) {
    return loggedError(null, 'Could not create Proxy.', address);
  }

  // approve proxy to take nft
  try {
    await tinlake.approveNFT(tokenId, proxyAddress);
  } catch(e) {
    return loggedError(e, 'Could not approve proxy to take NFT.', tokenId);
  }

  // transfer issue
  let result;
  try {
    result = await tinlake.proxyTransferIssue(proxyAddress, tokenId);
  } catch (e) {
    return loggedError(e, 'Could not Issue loan.', tokenId)
  }

  if (result.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not Issue loan.', tokenId)
  }

  const loanId = await tinlake.nftLookup(nftRegistryAddress, tokenId);
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
  await addProxyDetails(tinlake, loan);
  
  return {
    data: loan
  }
}

async function addProxyDetails(tinlake: any, loan: Loan) {
  try {
    loan.proxyOwner = await tinlake.getProxyOwnerByLoan(loan.loanId);
  } catch(e) {
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
    const loan = loans[i];
    await addProxyDetails(tinlake, loan);
    loansList.push(loan);
  }
  return {
    data: loansList
  }
}

export async function setCeiling(tinlake: any, loanId: string, ceiling: string) {
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

export async function setInterest(tinlake: any, loanId: string, debt: string, rate: string) {
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
    return {
      data: {
        junior: {
          type: "Junior",
          availableFunds: await tinlake.getJuniorReserve(),
          tokenPrice: await tinlake.getTokenPriceJunior(),
          token: "TIN"
        }
      }
    }
  } catch(e) {
    return loggedError(e, 'Could not get analytics data', '');
  } 


} 

export async function borrow(tinlake: any, loan: Loan, amount: string) {
  const { loanId } = loan;
  const address = tinlake.ethConfig.from;
  const proxy = loan.ownerOf;

  // make sure tranche has enough funds
  const juniorReserve = await tinlake.getJuniorReserve();
  const seniorReserve = await tinlake.getSeniorReserve();
  const trancheReserve = juniorReserve.add(seniorReserve);
  if(new BN(amount).cmp(trancheReserve) > 0) {
    return loggedError({},'There is not enough available funds.', loanId);
  }
  
  //borrow with proxy
  let borrowRes;
  try {
    borrowRes = await tinlake.proxyLockBorrowWithdraw(proxy, loanId, amount, address);
  } catch(e){
    return loggedError(e, 'Could not borrow.', loanId);
  }
  if (borrowRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not borrow', loanId);
  }
}

// repay full loan debt
export async function repay(tinlake: any, loan: Loan) {
  const { loanId } = loan;
  const proxy = loan.ownerOf;
  // user entrie user balance as repay amount to make sure that enough funds are provided to cover the entire debt
  const approvalAmount  = await tinlake.getCurrencyBalance(tinlake.ethConfig.from);
  
  let approveRes;
  try {
    approveRes = await tinlake.approveCurrency(proxy, approvalAmount);
  } catch(e){
    return loggedError(e, 'Could not approve proxy.', loanId);
  }
  if (approveRes.status !== SUCCESS_STATUS) {
    return loggedError({"response": approveRes}, 'Could not approve proxy', loanId);
  }
   
  // repay
  let repayRes;
  try {
    repayRes = await tinlake.proxyRepayUnlockClose(proxy, loan.tokenId, loanId);
  } catch(e){
    return loggedError(e, 'Could not repay.', loanId);
  }
  if (repayRes.status !== SUCCESS_STATUS) {
    return loggedError({"response" : repayRes}, 'Could not repay', loanId);
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
  } catch(e) {
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
