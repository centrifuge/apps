Feature: Investment flow

    Only admins should be allowed to do this

    Background:
        Given I am logged into MetaMask as Tinlake admin
        And I am on the Tinlake investments page
        And I am connected to Tinlake
        And I have reloaded the page

    Scenario Outline: successfully investing
        Given there is no outstanding order or collection for the <tranche> tranche
        When I invest 10 DAI for <tranche>
        Then there is an outstanding order for the <tranche> tranche
        And I cancel my <tranche> order
        And there is no outstanding order or collection for the <tranche> tranche

        Examples:
            | tranche |
            | DROP    |
            | TIN     |