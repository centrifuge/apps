import BN from 'bn.js';
import { Loan, NFT, interestRateToFee } from 'tinlake';

export type TrancheType = "junior" | "senior";
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const SUCCESS_STATUS = '0x1';

interface TinlakeResult {
  data?: any;
  errorMsg?: string;
  tokenId?: string;
  loanId?: string;
}

export async function getNFT(registry: string, tinlake: any, tokenId: string) {
  let nftOwner: string;
  let nftData: any;

  try {
    nftOwner = await tinlake.getOwnerOfCollateral(registry, tokenId);
  } catch (e) {
    return loggedError(e, 'Could not get NFT owner for NFT ID', tokenId);
  }

  if (!nftOwner) {
    return loggedError({}, 'Could not get NFT owner for NFT ID', tokenId);
  }

  try {
    nftData = await tinlake.getNFTData(registry, tokenId);
  } catch (e) {
    // return loggedError(e, 'Could not get NFT data for NFT ID', tokenId);
    nftData = null;
  }
  const replacedTokenId = tokenId.replace(/^0x/, '');
  const bnTokenId = new BN(replacedTokenId);

  const nft: NFT = {
    nftOwner,
    nftData,
    registry,
    tokenId: bnTokenId
  };

  return {
    nft,
    tokenId
  };
}

export async function issue(tinlake: any, tokenId: string, nftRegistryAddress: string) {
  let proxyAddress;
  const address = tinlake.ethConfig.from;
  try {
    proxyAddress = await tinlake.checkProxyExists(address);
    console.log('proxy found', proxyAddress);
  } catch (e) {
    proxyAddress = null;
  }

  if (!proxyAddress) {
    try {
      proxyAddress = await tinlake.proxyCreateNew(address);
      console.log('proxy not found, new proxy address', proxyAddress);
    } catch (e) {
      return loggedError(e, 'Could not create Proxy.', address);
    }
  }
  if (!proxyAddress) {
    return loggedError(null, 'Could not create Proxy.', address);
  }

  // approve proxy to take nft
  try {
    await tinlake.approveNFT(nftRegistryAddress, tokenId, proxyAddress);
  } catch (e) {
    return loggedError(e, 'Could not approve proxy to take NFT.', tokenId);
  }

  // transfer issue
  let result;
  try {
    result = await tinlake.proxyTransferIssue(proxyAddress, nftRegistryAddress, tokenId);
  } catch (e) {
    return loggedError(e, 'Could not Issue loan.', tokenId);
  }

  if (result.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not Issue loan.', tokenId);
  }

  const loanId = await tinlake.nftLookup(nftRegistryAddress, tokenId);
  return {
    data: loanId
  };
}

export async function getProxyOwner(tinlake: any, loanId: string) : Promise<TinlakeResult> {
  let owner = ZERO_ADDRESS;
  try {
    owner = await tinlake.getProxyOwnerByLoan(loanId);
  } catch (e) {
  }
  return { data: owner };
}

export async function getLoan(tinlake: any, loanId: string) : Promise<TinlakeResult> {
  let loan;
  const count = await tinlake.loanCount();

  if (count.toNumber() <= Number(loanId) || Number(loanId) === 0) {
    return loggedError({}, 'Loan not found', loanId);
  }

  try {
    loan = await tinlake.getLoan(loanId);
  } catch (e) {
    return loggedError(e, 'Loan not found', loanId);
  }

  const nftData = await getNFT(loan.registry, tinlake, `${loan.tokenId}`);
  loan.nft = nftData && nftData.nft || {};
  await addProxyDetails(tinlake, loan);

  return {
    data: loan
  };
}

async function addProxyDetails(tinlake: any, loan: Loan) {
  try {
    loan.proxyOwner = await tinlake.getProxyOwnerByLoan(loan.loanId);
  } catch (e) {
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
  for (let i = 0; i < loans.length; i += 1) {
    const loan = loans[i];
    await addProxyDetails(tinlake, loan);
    loansList.push(loan);
  }
  return {
    data: loansList
  };
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
  const existsRateGroup = await tinlake.existsRateGroup(rateGroup);

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
    if (debt.toString() === '0') {
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
  const juniorReserve = await tinlake.getJuniorReserve();
  const juniorTokenPrice = await tinlake.getTokenPriceJunior();
  const seniorReserve = await tinlake.getSeniorReserve();
  const seniorTokenPrice = await tinlake.getTokenPriceSenior();
  const seniorInterestRate = await tinlake.getSeniorInterestRate();
  const minJuniorRatio = await tinlake.getMinJuniorRatio();
  const juniorAssetValue = await tinlake.getAssetValueJunior();
  // temp fix: until solved on contract level
  const currentJuniorRatio = (juniorAssetValue.toString() === '0') ? new BN(0) : await tinlake.getCurrentJuniorRatio();

  try {
    return {
      data: {
        junior: {
          type: "junior",
          availableFunds: juniorReserve,
          tokenPrice: juniorTokenPrice,
          token: "TIN"
        },
        senior: {
          type: "senior",
          availableFunds: seniorReserve,
          tokenPrice: seniorTokenPrice,
          token: "DROP",
          interestRate: seniorInterestRate
        },
        availableFunds: juniorReserve.add(seniorReserve),
        minJuniorRatio: minJuniorRatio,
        currentJuniorRatio: currentJuniorRatio
      }
    }
  } catch (e) {
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
  if (new BN(amount).cmp(trancheReserve) > 0) {
    return loggedError({}, 'There is not enough available funds.', loanId);
  }

  // borrow with proxy
  let borrowRes;
  try {
    borrowRes = await tinlake.proxyLockBorrowWithdraw(proxy, loanId, amount, address);
  } catch (e) {
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
  } catch (e) {
    return loggedError(e, 'Could not approve proxy.', loanId);
  }
  if (approveRes.status !== SUCCESS_STATUS) {
    return loggedError({ response: approveRes }, 'Could not approve proxy', loanId);
  }

  // repay
  let repayRes;
  try {
    repayRes = await tinlake.proxyRepayUnlockClose(proxy, loan.tokenId, loanId, loan.registry);
  } catch (e) {
    return loggedError(e, 'Could not repay.', loanId);
  }
  if (repayRes.status !== SUCCESS_STATUS) {
    return loggedError({ response: repayRes }, 'Could not repay', loanId);
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
  };
}

export async function setAllowance(tinlake: any, address: string, maxSupplyAmount: string, maxRedeemAmount: string, trancheType: TrancheType) {
  let setRes;
  try {
    if (trancheType === "junior") {
      setRes = await tinlake.approveAllowanceJunior(address, maxSupplyAmount, maxRedeemAmount);
    } else if (trancheType === "senior") {
      setRes = await tinlake.approveAllowanceSenior(address, maxSupplyAmount, maxRedeemAmount);
    }
  } catch (e) {
    return loggedError(e, `Could not set allowance for ${trancheType}`, address);
  }
  if (setRes.status !== SUCCESS_STATUS) {
    return loggedError(null, `Could not set allowance for ${trancheType}`, address);
  }
}

export async function setMinJuniorRatio(tinlake: any, ratio: string) {
  let setRes;
  try {
    setRes = await tinlake.setMinimumJuniorRatio(ratio);
  } catch (e) {
    return loggedError(e, 'Could not set min TIN ratio', '');
  }

  if (setRes.status !== SUCCESS_STATUS) {
    return loggedError({}, 'Could not set min TIN ratio', '');
  }
}

export async function supply(tinlake: any, supplyAmount: string, trancheType: TrancheType) {
  // approve currency
  let approveRes;
  try {
    if (trancheType === "junior") {
      approveRes = await tinlake.approveJuniorForCurrency(supplyAmount);
    } else if (trancheType === "senior") {
      approveRes = await tinlake.approveSeniorForCurrency(supplyAmount);
    }
  } catch (e) {
    return loggedError(e, `Could not approve currency for ${trancheType}.`, '');
  }
  if (approveRes.status !== SUCCESS_STATUS) {
    return loggedError({}, `Could not approve currency for ${trancheType}.`, '');
  }

  // supply
  let supplyRes;
  try {
    if (trancheType === "junior") {
      supplyRes = await tinlake.supplyJunior(supplyAmount);
    } else if (trancheType === "senior") {
      supplyRes = await tinlake.supplySenior(supplyAmount);
    }
  } catch (e) {
    return loggedError(e, `Could not supply ${trancheType}`, '');
  }
  if (supplyRes.status !== SUCCESS_STATUS) {
    return loggedError({}, `Could not supply ${trancheType}`, '');
  }
}

export async function redeem(tinlake: any, redeemAmount: string, trancheType: TrancheType) {
  // approve junior token 
  let approveRes;
  try {
    if (trancheType === "junior") {
      approveRes = await tinlake.approveJuniorToken(redeemAmount)
    } else if (trancheType === "senior")
      approveRes = await tinlake.approveSeniorToken(redeemAmount);
  } catch (e) {
    return loggedError(e, `Could not approve ${trancheType} Token.`, '');
  }
  if (approveRes.status !== SUCCESS_STATUS) {
    return loggedError({}, `Could not approve ${trancheType} Token.`, '');
  }

  // repay
  let redeemRes;
  try {
    if (trancheType === "junior") {
      redeemRes = await tinlake.redeemJunior(redeemAmount);
    } else if (trancheType === "senior") {
      redeemRes = await tinlake.redeemSenior(redeemAmount);
    }
  } catch (e) {
    return loggedError(e, `Could not redeem ${trancheType}.`, '');
  }
  if (redeemRes.status !== SUCCESS_STATUS) {
    return loggedError({}, `Could not redeem ${trancheType}.`, '');
  }
}

function loggedError(error: any, message: string, id: string) {
  console.log(`${message} ${id}`, error);
  return {
    errorMsg: `${error} - ${message} ${id}`,
    id
  };
}
