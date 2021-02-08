#!/bin/bash
GIT_SHORT_COMMIT=`git rev-parse --short HEAD`
BRANCH_ABBR=`git rev-parse --abbrev-ref HEAD`
TIMESTAMP=`date -u +%Y%m%d%H%M%S`
TAG="${TRAVIS_BRANCH}-${TIMESTAMP}-${GIT_SHORT_COMMIT}"
echo "$TAG"
