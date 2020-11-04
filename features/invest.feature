Feature: Investment flow

    Only admins should be allowed to do this

    Scenario: successfully investing into TIN
        Given I am logged into MetaMask as Tinlake admin
        And I am on the Tinlake investments page
        And I am connected to Tinlake
        And I have reloaded the page
        And there is no outstanding order or collection for the TIN tranche
        When I invest 10 DAI for TIN
        And I have reloaded the page
        And there is an outstanding order for the TIN tranche
        And I cancel my TIN order
        Then there is no outstanding order or collection for the TIN tranche

    Scenario: successfully investing into DROP
        Given I am logged into MetaMask as Tinlake admin
        And I am on the Tinlake investments page
        And I am connected to Tinlake
        And I have reloaded the page
        And there is no outstanding order or collection for the DROP tranche
        When I invest 5 DAI for DROP
        And I have reloaded the page
        And there is an outstanding order for the DROP tranche
        And I cancel my DROP order
        Then there is no outstanding order or collection for the DROP tranche