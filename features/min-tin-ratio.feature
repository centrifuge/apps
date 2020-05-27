Feature: Set Min TIN ratio

  Only admins shold allowed to do this

  Scenario: successful setting the min TIN ratio as admin
    Given I am on the Tinlake investments page
    And I am connected as admin
    When I set Min TIN ratio to 10%
    Then I see that Min TIN ratio component is set to 10%
