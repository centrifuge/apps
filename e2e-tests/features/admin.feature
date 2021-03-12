@metamask
# Feature: Set min TIN ratio

#   Only admins should be allowed to do this

#   Background:
#     Given I am logged into MetaMask as Tinlake admin
#     And I am on the Tinlake investments page
#     And I am connected to Tinlake
#     And I have reloaded the page

#   Scenario: successfully setting the min TIN ratio
#     Given the min TIN ratio is set to 10%
#     And I have reloaded the page  
#     When I set Min TIN ratio to 11%
#     Then I see that Min TIN ratio component is set to 11%
#     And I can verify that the min TIN ratio is set to 11%
