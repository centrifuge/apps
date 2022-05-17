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
    title: 'placeholder title',
    body: 'placeholder body',
  },
  invested30d: {
    label: 'Invested (30d)',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  redeemed30d: {
    label: 'Redeemed (30d)',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  repaid30d: {
    label: 'Repaid (30d)',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  upcomingRepayments30d: {
    label: 'Upcoming repayments (30d)',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  cashDrag: {
    label: 'Cash drag',
    title: 'placeholder title',
    body: 'placeholder body',
  },
  epochTimeRemaining: {
    label: '',
    title: 'placeholder title',
    body: 'placeholder body',
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
