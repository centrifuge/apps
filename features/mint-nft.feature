Feature: Mint NFT

  Kovan Staging only

  Background:
    Given I am logged into MetaMask as borrower
    And I am on the Tinlake mint NFT page
    And I am connected to Tinlake
    And I have reloaded the page

  Scenario: successfully mint an NFT
    Given I have set the NFT reference to "demo"
    When I do mint NFT
    Then I see that NFT ID is shown in UI
    # And that minted NFT is in my wallet
