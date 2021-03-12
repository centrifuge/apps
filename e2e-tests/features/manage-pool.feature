@metamask
Feature: Set min TIN ratio

    Only AOs should be allowed to do this

    Background:
        Given I am logged into MetaMask as Tinlake admin
        And I am on the Tinlake assets page
        And I am connected to Tinlake
        And I have reloaded the page

    Scenario: successfully setting the max reserve amount
        Given the max reserve amount is set to X
        And I have reloaded the page
        When I increase the max reserve amount by 1
        And I have reloaded the page
        Then I can verify that the max reserve amount is set to X+1
