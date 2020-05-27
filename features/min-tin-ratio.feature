Feature: Set Min TIN ratio

  Only admins shold allowed to do this

  Scenario: successfully setting the min TIN ratio as admin
    Given I am logged into MetaMask as Tinlake admin
    And I am on the Tinlake investments page
    And I am connected to Tinlake
    When I set Min TIN ratio to 12%
    Then I see that Min TIN ratio component is set to 12%
