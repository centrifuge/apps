#!/bin/sh
# wait for the contracts and subgraph containers to finish, and run tests

set -e

until [ -z `docker-compose ps -q subgraph` ] || [ -z `docker ps -q --no-trunc | grep $(docker-compose ps -q subgraph)` ]; do
  >&2 echo "Subgraphs is deploying - sleeping"
  sleep 1
done

echo "Finished subgraph"


until [ -z `docker-compose ps -q contracts` ] || [ -z `docker ps -q --no-trunc | grep $(docker-compose ps -q contracts)` ]; do
  >&2 echo "Contracts are deploying - sleeping"
  sleep 1
done

echo "Finished contracts"