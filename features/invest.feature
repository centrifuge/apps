Feature: Investment flow

    Only admins should be allowed to do this

    Background:
        Given I am logged into MetaMask as Tinlake admin
        And I am on the Tinlake investments page
        And I am connected to Tinlake
        And I have reloaded the page

    Scenario Outline: successfully investing & redeeming
        Given there is no outstanding order or collection for the <tranche> tranche
        When I <order> <amount> DAI for <tranche>
        And I have reloaded the page
        Then there is an outstanding order for the <tranche> tranche
        And I cancel my <tranche> order
        And there is no outstanding order or collection for the <tranche> tranche

        Examples:
            | tranche | order  | amount |
            | DROP    | invest | 40     |
            | TIN     | invest | 30     |
            | DROP    | redeem | 20     |
            | TIN     | redeem | 10     |