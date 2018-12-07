#!/bin/bash
GIT_SHORT_COMMIT=`git rev-parse --short HEAD`
TRAVIS_BRANCH=`git rev-parse --abbrev-ref HEAD`
TIMESTAMP=`date -u +%Y%m%d%H`
TAG="${TRAVIS_BRANCH}-${TIMESTAMP}-${GIT_SHORT_COMMIT}"
IMAGE_NAME="${DOCKER_USERNAME}/go-centrifuge"
docker "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
docker build -t "${IMAGE_NAME}:${TAG}" .
docker tag "${IMAGE_NAME}:${TAG}" "${IMAGE_NAME}:latest"
docker push "${IMAGE_NAME}:latest"
docker push "${IMAGE_NAME}:${TAG}"