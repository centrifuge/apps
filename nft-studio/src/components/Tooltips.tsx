import { Text, Tooltip as FabricTooltip } from '@centrifuge/fabric'
import * as React from 'react'

const tooltipText = {
  loanType: {
    label: 'Loan value',
    title: '',
    body: 'This refers to the loan type used to finance the asset. This can e.g. be bullet loans or interest bearing loans. The loan type determines in particular the cash flow profile of the financing.',
  },
  collateralValue: {
    label: 'Collateral value',
    title: '',
    body: 'Collateral value refers to the value of the collateral underlying the real-world asset on-chain.',
  },
  riskGroup: {
    label: 'Risk group',
    title: '',
    body: 'Risk group set by the issuer for the asset indicating the likelihood of a default. To learn more read about the issuers risk groupings here...',
  },
  assetClass: {
    label: 'Asset Class',
    title: '',
    body: 'Assets can be grouped into classes that exhibit similar characteristics in terms of maturity, volume, type of financing, underlying collateral and/or risk return profile.',
  },
  apy: {
    label: 'APY',
    title: '',
    body: 'The Annual Percentage Yield ("APY") of a token is calculated as the effective annualized return of the pool\'s token price.',
  },
  protection: {
    label: 'Protection',
    title: '',
    body: 'The risk protection is the minimum value of the junior token in relation to the pool value. It denotes how much of the pool is always protected by the junior tranche against asset defaults.',
  },
  valueLocked: {
    label: 'Value locked',
    title: '',
    body: 'Value locked represents the current total value of pool tokens in `{pool currency}`.',
  },
  tvl: {
    label: 'Total value locked (TVL)',
    title: '',
    body: 'Total value locked (TVL) represents the sum of all ongoing assets and the amounts locked in the reserve in all Centrifuge pools.',
  },
  tokens: {
    label: 'Tokens',
    title: '',
    body: 'Number of tokens that can be invested in on Centrifuge.',
  },
  age: {
    label: 'Age',
    title: '',
    body: 'This indicates the age of the pool from creation date to today.',
  },
  averageAssetMaturity: {
    label: 'Average asset maturity',
    title: '',
    body: "This indicates the expected range of maturities of the pool's underlying assets, i.e. the time period after which the financing of this assets matures and will be paid back.",
  },
  poolValue: {
    label: 'Pool value',
    title: '',
    body: 'The pool value is the current value of financed assets ("Asset value") plus the reserve. It is equal to value locked in the tranches of the pool.',
  },
  reserve: {
    label: 'Reserve',
    title: '',
    body: 'The reserve represents the amount of available liquidity in the pool available for loan originations by the issuer and redemptions by investors.y',
  },
  assetValue: {
    label: 'Asset value',
    title: '',
    body: 'The asset value or NAV reflects the present value of the outstanding portfolio of financings. It is the sum of the present values of the risk-adjusted expected repayments of all outstanding financings.',
  },
  ongoingAssets: {
    label: 'Ongoing assets',
    title: '',
    body: 'Number of assets currently being financed in the pool and awaiting repayment.',
  },
  averageFinancingFee: {
    label: 'Average financing fee',
    title: '',
    body: 'The average financing fee of the assets in the pool.',
  },
  averageAmount: {
    label: 'Average amount',
    title: '',
    body: 'The average outstanding amount of the assets in the pool.',
  },
  poolReserve: {
    label: 'Pool reserve',
    title: '',
    body: 'The reserve represents the amount of available liquidity in the pool available for loan originations by the issuer and redemptions by investors.',
  },
  invested30d: {
    label: 'Invested (30d)',
    title: '',
    body: 'The total amount invested by investors into the pool over the past 30 days. ',
  },
  redeemed30d: {
    label: 'Redeemed (30d)',
    title: '',
    body: 'The total amount redeemed by investors from the pool over the past 30 days. ',
  },
  repaid30d: {
    label: 'Repaid (30d)',
    title: '',
    body: 'The total amount repaid by the issuer over the past 30 days. ',
  },
  upcomingRepayments30d: {
    label: 'Upcoming repayments (30d)',
    title: '',
    body: 'Expected repayments by the issuer in the next 30 days. ',
  },
  cashDrag: {
    label: 'Cash drag',
    title: '',
    body: "Share of the pool's value locked that is currently in the pool’s reserve and not financing assets. Liquidity in the pool’s reserve does not earn yield and thus drags down investor’s returns.",
  },
  epochTimeRemaining: {
    label: 'override',
    title: 'e',
    body: 'Time remaining until the next epoch can be closed and orders executed providing sufficient investment capacity and liquidity.',
  },
  issuerName: {
    label: 'override',
    title: '',
    body: 'This is the legal entity, usually a special purpose vehicle, that holds the pools assets.',
  },
  tokenSymbol: {
    label: 'override',
    title: '',
    body: 'Add a 6-digit token symbol that reflects the risk and tranche of the token.',
  },
  minimumInvestment: {
    label: 'Minimum investment',
    title: '',
    body: 'The minimum amount that can be invested in the token of a pool.',
  },
  advanceRate: {
    label: 'Advance rate',
    title: '',
    body: 'The advance rate is the percentage amount of the value of the collateral that an issuer can borrow from the pool against the NFT representing the collateral.',
  },
  financingFee: {
    label: 'Financing fee',
    title: '',
    body: 'The financing fee is the rate at which the outstanding amount of an individual financing accrues interest. It is expressed as an "APR" (Annual Percentage Rate) and compounds interest every second.',
  },
  probabilityOfDefault: {
    label: 'Prob of default',
    title: '',
    body: 'The probablility of default is the likelyhood of a default occuring for an asset in this risk group.',
  },
  lossGivenDefault: {
    label: 'Loss given default',
    title: '',
    body: 'Loss given default (LGD) is the amount expected to be recovered and repaid to the pool in case of a default of a financing.',
  },
  riskAdjustment: {
    label: 'Risk adjustment',
    title: '',
    body: 'This is the assumed risk adjustment applied to outstanding financings of the corresponding risk group to calculate the NAV of the asset portfolio. It is calculated as the product of the probability of default and loss given default.',
  },
  discountRate: {
    label: 'Discount rate',
    title: '',
    body: 'The discount rate is used to determine the present value of a financing by discounting the risk-adjusted expected interest payments and repayments. It usually reflects the rate of return an investor could earn in the marketplace on an investment of comparable size, maturity and risk.',
  },
}

type TooltipsProps = {
  type: keyof typeof tooltipText
  variant?: 'primary' | 'secondary'
  label?: string
}

export const Tooltips: React.VFC<TooltipsProps> = ({ type, label: labelOverride, variant = 'primary' }) => {
  const { label, title, body } = tooltipText[type]
  const isPrimary = variant === 'primary'
  return (
    <FabricTooltip title={title} body={body}>
      <Text textAlign="left" variant="label2" color={isPrimary ? 'textPrimary' : 'textSecondary'}>
        {labelOverride || label}
      </Text>
    </FabricTooltip>
  )
}
