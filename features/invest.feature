Feature: Investment flow

    Only admins should be allowed to do this

    Scenario: successfully investing into TIN
        Given I am logged into MetaMask as Tinlake admin
        And I am on the Tinlake investments page
        And I am connected to Tinlake
        And I have reloaded the page
        And I have clicked the Invest button for the TIN tranche
        When I set the investment amount to 10 DAI
