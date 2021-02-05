#!/bin/sh
# wait for the graph and deploy

set -e
  
until curl -f -X GET ${GRAPH_HOST}:8000; do
  >&2 echo "Graph is unavailable - sleeping"
  sleep 1
done
  
>&2 echo "Graph is up - deploying subgraph"

./node_modules/.bin/graph create --node ${GRAPH_HOST}:8020 centrifuge/${PROJECT}
./node_modules/.bin/graph deploy --node ${GRAPH_HOST}:8020 --ipfs ${IPFS_HOST} centrifuge/${PROJECT}