#!/bin/bash

# Variables
MAIN_BRANCH="main"
PACKAGE_NAME="google-github-actions"
DEPENDABOT_BRANCH="dependabot/github_actions/dot-github/workflows/$PACKAGE_NAME" # Replace with the actual branch name
NEW_BRANCH="dependabot-merge-$PACKAGE_NAME"
REPO="centrifuge/apps" # Replace with your GitHub repo in the format owner/repo
PR_TITLE="Update $PACKAGE_NAME"
PR_BODY="This PR merges the changes from $DEPENDABOT_BRANCH into $MAIN_BRANCH."
DEPENDABOT_PR_NUMBER=2624 # Replace with the actual PR number

# Checkout main and pull latest changes
git checkout $MAIN_BRANCH
git pull origin $MAIN_BRANCH

# Create and checkout new branch
git checkout -b $NEW_BRANCH

# Merge Dependabot branch
git merge $DEPENDABOT_BRANCH

# Push new branch to origin
git push origin $NEW_BRANCH

# Create a new PR using GitHub CLI
gh pr create --base $MAIN_BRANCH --head $NEW_BRANCH --title "$PR_TITLE" --body "$PR_BODY"

# Get the new PR number
NEW_PR_NUMBER=$(gh pr view --json number -q .number)

# Comment on the original Dependabot PR
gh pr comment $DEPENDABOT_PR_NUMBER --body "Merged into $MAIN_BRANCH via PR #$NEW_PR_NUMBER."

# Close the original Dependabot PR
gh pr close $DEPENDABOT_PR_NUMBER