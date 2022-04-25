import React from 'react'
import styled from 'styled-components'
import { Shelf, Stack } from '../Layout'

export const HowItWorks: React.FC = () => {
  return (
    <Stack gap="24px">
      <Title>How it works</Title>
      <LongText>
        The RWA Market allows investors to earn yield against a diversified portfolio of stable, uncorrelated real-world
        collateral such as Real Estate Bridge Loans, Trade Receivables, Inventory, and Revenue Based Financing. It is a
        permissioned market serviced by END_Labs. To invest you will onboarding via KYC and signing a subsciption
        agreement with the issuer.
      </LongText>
      <Stack gap="16px">
        <Shelf justifyContent="flex-start">
          <Label>Issuer</Label>
          <ValueText>RWA Market LLC</ValueText>
        </Shelf>
        <Shelf justifyContent="flex-start">
          <Label>Links</Label>
          <SmallIcon src="/static/rwa/aave.svg" />
          <ValueLink href="https://rwamarket.io" target="_blank">
            <ValueText>rwamarket.io</ValueText>
          </ValueLink>
        </Shelf>
      </Stack>
    </Stack>
  )
}

const Title = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
`

const LongText = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
`

const Label = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;

  color: #777777;

  width: 72px;
`

const SmallIcon = styled.img`
  weight: 16px;
  height: 16px;
  margin-right: 8px;
`

const ValueText = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
`

const ValueLink = styled.a`
  text-decoration: none;
  color: #000;
  :hover {
    text-decoration: underline;
  }
`
