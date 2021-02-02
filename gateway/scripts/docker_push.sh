#!/bin/bash
GIT_SHORT_COMMIT=`git rev-parse --short HEAD`
BRANCH_ABBR=`git rev-parse --abbrev-ref HEAD`
TRAVIS_BRANCH=${TRAVIS_BRANCH:-$BRANCH_ABBR}
TIMESTAMP=`date -u +%Y%m%d%H%M%S`
TAG="${TRAVIS_BRANCH}-${TIMESTAMP}-${GIT_SHORT_COMMIT}"
IMAGE_NAME="centrifugeio/gateway"
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker build -t "${IMAGE_NAME}:${TAG}" .
docker tag "${IMAGE_NAME}:${TAG}" "${IMAGE_NAME}:latest"
docker push "${IMAGE_NAME}:latest"
docker push "${IMAGE_NAME}:${TAG}"
