Feature: View Dashboard

  Background:
    Given I am on the Tinlake dashboard

  Scenario: visit the page
    Then I see at least one pool in the list
    And the first pool in the list has a positive DROP APR
    And the total financed to date amount is positive
