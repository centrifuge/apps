Feature: Set Min TIN ratio

  Only admins should be allowed to do this

  Scenario: successfully setting the min TIN ratio as admin
    Given I am logged into MetaMask as Tinlake admin
    And I am on the Tinlake investments page
    And I am connected to Tinlake
    And the min TIN ratio is set to 10%
    When I set Min TIN ratio to 11%
    # TODO: I see that Min TIN ratio component is set to 11%
    Then I can verify that the min TIN ratio is set to 11%
